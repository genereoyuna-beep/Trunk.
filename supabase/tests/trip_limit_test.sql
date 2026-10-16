-- 無料の枠と作り替えの決まりを確かめる（実行しても何も残らない）
-- 仮のテスト用ユーザーで旅行を作ったり直したりして、最後にわざとエラーで止めてすべて取り消す。
-- 結果はエラー文の中に「RESULT: 1 ok; 2 ok; …」の形で出る。NG があれば決まりどおりに動いていない。
do $$
declare
  u  uuid := '00000000-0000-0000-0000-00000000a11a';
  t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid(); t3 uuid := gen_random_uuid();
  t4 uuid := gen_random_uuid(); t5 uuid := gen_random_uuid();
  res text := '';
  so date;
  stay_ jsonb;
begin
  insert into auth.users (id, aud, role, email) values (u, 'authenticated', 'authenticated', 'trip-limit-test@example.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  -- 1. 先の旅行を1つ作る → できる
  insert into public.trips (id, name, data) values (t1, 'A', jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 30)::text, 'nights', 2))));
  res := res || '1 ok; ';

  -- 2. もう1つ先の旅行を作る → 止まる
  begin
    insert into public.trips (id, name, data) values (t2, 'B', jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 60)::text, 'nights', 2))));
    res := res || '2 NG(作れてしまった); ';
  exception when others then res := res || case when sqlerrm = 'trip_limit' then '2 ok; ' else '2 NG(' || sqlerrm || '); ' end;
  end;

  -- 3. 終わった旅行を作る → できる（数えない）
  insert into public.trips (id, name, data) values (t3, 'C', jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date - 20)::text, 'nights', 3))));
  res := res || '3 ok; ';

  -- 4. 終わった旅行の日付を先に動かす → 止まる
  begin
    update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 90)::text, 'nights', 3))) where id = t3;
    res := res || '4 NG(作り替えられてしまった); ';
  exception when others then res := res || case when sqlerrm = 'trip_limit' then '4 ok; ' else '4 NG(' || sqlerrm || '); ' end;
  end;

  -- 5. 終わった旅行のメモを直す → できる
  update public.trips set data = data || '{"memo":"おみやげ"}' where id = t3;
  res := res || '5 ok; ';

  -- 6. アプリからパスや日付を直接書く → 権限がなく止まる
  begin
    update public.trips set end_date = current_date - 1 where id = t1;
    res := res || '6 NG(日付を書けてしまった); ';
  exception when insufficient_privilege then res := res || '6 ok; ';
  end;

  -- 7. 先の旅行を消してから、終わった旅行を先に動かす → 空きがあるのでできる
  delete from public.trips where id = t1;
  update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 90)::text, 'nights', 3))) where id = t3;
  res := res || '7 ok; ';
  delete from public.trips where id = t3;

  -- 8. 旅行中の旅行を延ばす（始まった時点の帰る日から30日以内） → できる、作り替えにならない
  stay_ := jsonb_build_object('type', 'stay', 'startDate', (current_date - 2)::text, 'nights', 5);
  insert into public.trips (id, name, data) values (t4, 'D', jsonb_build_object('itinerary', jsonb_build_array(stay_)));
  update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(stay_ || '{"nights":20}')) where id = t4;
  select started_on into so from public.trips where id = t4;
  res := res || case when so is not null then '8 ok; ' else '8 NG(作り替え扱いになった); ' end;

  -- 9. 旅行中に別の先の旅行を作る → 止まる
  begin
    insert into public.trips (id, name, data) values (t5, 'E', jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 40)::text, 'nights', 2))));
    res := res || '9 NG(作れてしまった); ';
  exception when others then res := res || case when sqlerrm = 'trip_limit' then '9 ok; ' else '9 NG(' || sqlerrm || '); ' end;
  end;

  -- 10. 旅行中の旅行を、30日を超えて延ばす → 新しい旅行として数える（ほかに進行中がないので保存はできる）
  update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(stay_ || '{"nights":90}')) where id = t4;
  select started_on into so from public.trips where id = t4;
  res := res || case when so is null then '10 ok; ' else '10 NG(作り替えにならなかった); ' end;

  raise exception 'RESULT: %', res;
end $$;
