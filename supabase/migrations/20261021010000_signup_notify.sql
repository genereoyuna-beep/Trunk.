-- 新しい人が登録したら、運営者にメールで知らせる（2026-10-21）
-- 送るのは「登録した人の合計」と日時だけ（名前やメールアドレスは送らない）。
-- 合言葉は、すでに入っている要望の知らせ（feedback_notify）から取り出して使う（ここには書かない）。
do $$
declare sec text;
begin
  sec := substring(pg_get_functiondef('public.feedback_notify()'::regprocedure) from '''x-notify-secret'', ''([0-9a-f]+)''');
  if sec is null then raise exception '要望の知らせ（feedback_notify）の合言葉が見つかりません。先に 20261021000000_feedback_notify.sql を流してください'; end if;
  execute format($f$
    create or replace function public.signup_notify() returns trigger
    language plpgsql security definer set search_path = public, extensions as $b$
    begin
      perform net.http_post(
        url := 'https://s.trunk-travelplanner.com/notify/signup',
        body := jsonb_build_object('total', (select count(*) from auth.users), 'created_at', new.created_at),
        headers := jsonb_build_object('content-type', 'application/json', 'x-notify-secret', %L)
      );
      return new;
    exception when others then
      return new;  -- 知らせが送れなくても、登録は止めない
    end;
    $b$;
  $f$, sec);
end $$;
revoke all on function public.signup_notify() from public;

drop trigger if exists signup_notify on auth.users;
create trigger signup_notify after insert on auth.users for each row execute function public.signup_notify();
