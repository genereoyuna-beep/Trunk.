-- 共同編集の決まりを確かめる（実行しても何も残らない）
-- 仮のユーザー3人（作る人・同行者・関係ない人）で試し、最後にわざとエラーで止めてすべて取り消す。
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000c0a1';  -- 作る人
  b uuid := '00000000-0000-0000-0000-00000000c0b2';  -- 同行者
  c uuid := '00000000-0000-0000-0000-00000000c0c3';  -- 関係ない人
  t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid();
  tok text; v int; got uuid; n int; res text := '';
  fut jsonb := jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 30)::text, 'nights', 2)));
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'coedit-a@example.invalid', '{"name":"テストA"}'),
    (b, 'authenticated', 'authenticated', 'coedit-b@example.invalid', '{"name":"テストB"}'),
    (c, 'authenticated', 'authenticated', 'coedit-c@example.invalid', '{"name":"テストC"}');

  -- A が旅行を作り、招待リンクを作る
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  v := public.save_trip(t1, 'A の旅行', fut, null);
  insert into public.trip_invites (trip_id) values (t1) returning token into tok;
  res := res || '1 ok; ';

  -- B：参加する前は見えない → 招待を受けると見える
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.trips where id = t1;
  res := res || case when n = 0 then '2 ok; ' else '2 NG(参加前に見えた); ' end;
  got := public.accept_invite(tok);
  select count(*) into n from public.trips where id = t1;
  res := res || case when got = t1 and n = 1 then '3 ok; ' else '3 NG(参加できない); ' end;

  -- B が編集できる（版番号つき）
  v := public.save_trip(t1, 'A の旅行', fut || '{"memo":"B が書いた"}', v);
  res := res || '4 ok; ';

  -- 古い版番号で保存すると conflict
  begin
    perform public.save_trip(t1, 'A の旅行', fut, v - 1);
    res := res || '5 NG(上書きできてしまった); ';
  exception when others then res := res || case when sqlerrm = 'conflict' then '5 ok; ' else '5 NG(' || sqlerrm || '); ' end;
  end;

  -- B は旅行を消せない（消しても0件）
  delete from public.trips where id = t1;
  select count(*) into n from public.trips where id = t1;
  res := res || case when n = 1 then '6 ok; ' else '6 NG(消せてしまった); ' end;

  -- 参加した旅行は B の無料の枠に数えない：B は自分の旅行を1つ作れる
  begin
    perform public.save_trip(t2, 'B の旅行', fut, null);
    res := res || '7 ok; ';
  exception when others then res := res || '7 NG(' || sqlerrm || '); ';
  end;

  -- 顔ぶれが見える
  select count(*) into n from public.trip_people(t1);
  res := res || case when n = 2 then '8 ok; ' else '8 NG(' || n || '人); ' end;

  -- C：招待されていないので見えない・直せない・顔ぶれも見えない
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.trips where id = t1;
  update public.trips set data = '{}' where id = t1;
  res := res || case when n = 0 then '9 ok; ' else '9 NG(見えた); ' end;
  select count(*) into n from public.trip_people(t1);
  res := res || case when n = 0 then '10 ok; ' else '10 NG(顔ぶれが見えた); ' end;

  -- A がリンクを止めると、C は参加できない
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  update public.trip_invites set enabled = false where trip_id = t1;
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.accept_invite(tok);
    res := res || '11 NG(止めたリンクで参加できた); ';
  exception when others then res := res || case when sqlerrm = 'invite_invalid' then '11 ok; ' else '11 NG(' || sqlerrm || '); ' end;
  end;

  -- B が抜けると、もう見えない
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  delete from public.trip_members where trip_id = t1 and user_id = b;
  select count(*) into n from public.trips where id = t1;
  res := res || case when n = 0 then '12 ok; ' else '12 NG(抜けても見えた); ' end;

  raise exception 'RESULT: %', res;
end $$;
