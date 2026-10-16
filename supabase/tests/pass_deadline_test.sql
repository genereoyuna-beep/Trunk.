-- パスの出発期限（購入から1年）と、出発直後の延期（1回）を確かめる（実行しても何も残らない）
do $$
declare
  u uuid := '00000000-0000-0000-0000-00000000d1a1';
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid(); d uuid := gen_random_uuid();
  p3 uuid; pid uuid; pp boolean; so date; res text := '';
  stay_at int;
begin
  insert into auth.users (id, aud, role, email) values (u, 'authenticated', 'authenticated', 'pass-deadline-test@example.invalid');
  insert into public.passes (user_id, kind, valid_until) values (u, '3m', now() + interval '3 months') returning id into p3;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  -- 1. 無料の枠で1つ、3か月パスで1つ（30日後に出発）作れる
  insert into public.trips (id, name, data) values (a, 'A', jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 20)::text, 'nights', 2))));
  insert into public.trips (id, name, data) values (b, 'B', jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 30)::text, 'nights', 2))));
  select pass_id into pid from public.trips where id = b;
  res := res || case when pid = p3 then '1 ok; ' else '1 NG(パスが付かない); ' end;

  -- 2. 1年より先に出発する旅行には、3か月パスが使えない
  begin
    insert into public.trips (id, name, data) values (c, 'C', jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 400)::text, 'nights', 2))));
    res := res || '2 NG(作れてしまった); ';
  exception when others then res := res || case when sqlerrm = 'trip_limit' then '2 ok; ' else '2 NG(' || sqlerrm || '); ' end;
  end;

  -- 3. パスの旅行を1年より先にずらすと、パスから外れる（無料の枠が埋まっているので止まる）
  begin
    update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 400)::text, 'nights', 2))) where id = b;
    res := res || '3 NG(ずらせてしまった); ';
  exception when others then res := res || case when sqlerrm = 'trip_limit' then '3 ok; ' else '3 NG(' || sqlerrm || '); ' end;
  end;

  -- 4. 3か月パスの期限が切れたあと、日付を消すとパスから外れる（止まる）
  perform set_config('role', 'none', true);
  update public.passes set valid_until = now() - interval '1 day' where id = p3;
  perform set_config('role', 'authenticated', true);
  begin
    update public.trips set data = '{"itinerary": []}' where id = b;
    res := res || '4 NG(日付なしで残せてしまった); ';
  exception when others then res := res || case when sqlerrm = 'trip_limit' then '4 ok; ' else '4 NG(' || sqlerrm || '); ' end;
  end;

  -- 5. 期限が切れても、1年以内の延期ならパスのまま
  update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 200)::text, 'nights', 2))) where id = b;
  select pass_id into pid from public.trips where id = b;
  res := res || case when pid = p3 then '5 ok; ' else '5 NG(外れた); ' end;

  -- 6. 出発して2日目の延期（1回目）は、同じ旅行のまま
  delete from public.trips where id in (a, b);
  insert into public.trips (id, name, data) values (d, 'D', jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date - 2)::text, 'nights', 4))));
  update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 30)::text, 'nights', 4))) where id = d;
  select postponed into pp from public.trips where id = d;
  res := res || case when pp then '6 ok; ' else '6 NG(延期として扱われない); ' end;

  -- 7. 2回目の延期は、新しい旅行として数える（延期の印が消える）
  update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date - 1)::text, 'nights', 4))) where id = d;
  update public.trips set data = jsonb_build_object('itinerary', jsonb_build_array(jsonb_build_object('type', 'stay', 'startDate', (current_date + 60)::text, 'nights', 4))) where id = d;
  select postponed, started_on into pp, so from public.trips where id = d;
  res := res || case when not pp and so is null then '7 ok; ' else '7 NG(2回目も延期になった); ' end;

  raise exception 'RESULT: %', res;
end $$;
