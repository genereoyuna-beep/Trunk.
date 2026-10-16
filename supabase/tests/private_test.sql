-- 緊急時の情報が本人だけに見えるか・保存の上限を確かめる（実行しても何も残らない）
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000e0a01'; b uuid := '00000000-0000-0000-0000-0000000e0b02';
  t1 uuid := gen_random_uuid(); tok text; n int; res text := ''; d jsonb;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'priv-a@example.invalid'), (b, 'authenticated', 'authenticated', 'priv-b@example.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  -- 1. 旅行の中身に緊急時の情報を入れても、保存先が外す
  insert into public.trips (id, name, data) values (t1, 'A', '{"itinerary": [], "emergency": {"passport": "X1234"}}');
  select data into d from public.trips where id = t1;
  res := res || case when d ? 'emergency' then '1 NG(中身に残った); ' else '1 ok; ' end;
  -- 2. 本人は trip_private に書けて読める
  insert into public.trip_private (trip_id, emergency) values (t1, '{"passport": "X1234"}');
  select count(*) into n from public.trip_private where trip_id = t1;
  res := res || case when n = 1 then '2 ok; ' else '2 NG; ' end;
  insert into public.trip_invites (trip_id) values (t1) returning token into tok;
  -- 3. 招待された B には、A の緊急時の情報が見えない
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.accept_invite(tok);
  select count(*) into n from public.trip_private where trip_id = t1;
  res := res || case when n = 0 then '3 ok; ' else '3 NG(見えた); ' end;
  -- 4. B は自分の分を書ける
  insert into public.trip_private (trip_id, emergency) values (t1, '{"passport": "Y5678"}');
  select count(*) into n from public.trip_private where trip_id = t1;
  res := res || case when n = 1 then '4 ok; ' else '4 NG; ' end;
  -- 5. 大きすぎる旅行は保存できない
  begin
    update public.trips set data = jsonb_build_object('itinerary', '[]'::jsonb, 'memo', repeat('あ', 800000)) where id = t1;
    res := res || '5 NG(保存できた); ';
  exception when others then res := res || case when sqlerrm = 'trip_too_large' then '5 ok; ' else '5 NG(' || sqlerrm || '); ' end;
  end;
  raise exception 'RESULT: %', res;
end $$;
