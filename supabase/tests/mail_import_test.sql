-- 予約メールの取り込み：使える人・使えない人と、アドレスの発行を確かめる（実行しても何も残らない）
do $$
declare
  u uuid := '00000000-0000-0000-0000-00000000ma11';
  tok text; tok2 text; res text := ''; ok boolean;
begin
  insert into auth.users (id, aud, role, email) values (u, 'authenticated', 'authenticated', 'mail-import-test@example.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  -- 1. パスがなければ使えない
  select public.can_mail_import() into ok;
  res := res || case when not ok then '1 ok; ' else '1 NG(パスなしで使える); ' end;
  begin
    perform public.my_inbound_address();
    res := res || '2 NG(パスなしでアドレスが出た); ';
  exception when others then res := res || case when sqlerrm = 'not_paid' then '2 ok; ' else '2 NG(' || sqlerrm || '); ' end;
  end;

  -- 3. 3か月パスがあれば使え、アドレスは10文字の英数字で、2回呼んでも同じ
  perform set_config('role', 'none', true);
  insert into public.passes (user_id, kind, valid_until) values (u, '3m', now() + interval '3 months');
  perform set_config('role', 'authenticated', true);
  select public.my_inbound_address() into tok;
  select public.my_inbound_address() into tok2;
  res := res || case when tok ~ '^[a-z0-9]{10}$' and tok = tok2 then '3 ok; ' else '3 NG(' || coalesce(tok, 'null') || ' / ' || coalesce(tok2, 'null') || '); ' end;

  -- 4. アプリからは取り込み候補を作れない
  begin
    insert into public.inbound_items (user_id, subject) values (u, 'x');
    res := res || '4 NG(アプリから作れてしまう); ';
  exception when others then res := res || '4 ok; ';
  end;

  -- 5. 期限が切れたら使えない
  perform set_config('role', 'none', true);
  update public.passes set valid_until = now() - interval '1 day' where user_id = u;
  perform set_config('role', 'authenticated', true);
  select public.can_mail_import() into ok;
  res := res || case when not ok then '5 ok; ' else '5 NG(期限切れでも使える); ' end;

  raise exception 'RESULT: %', res;
end $$;
