-- 要望（feedback）が届いたら、運営者にメールで知らせる（2026-10-21）
-- データベースから Cloudflare（s.trunk-travelplanner.com/notify/feedback）を呼び、そこから確認済みのアドレスへメールを送る。
-- 送るのは要望の本文・送られた画面・日時だけ（名前やメールアドレスは feedback にもともと入っていない）。
-- __NOTIFY_SECRET__ は、cloudflare/share-worker の NOTIFY_SECRET と同じ値。リポジトリには書かず、流すときに差しこむ（docs/feedback-notify-setup.md）。
create extension if not exists pg_net with schema extensions;

create or replace function public.feedback_notify() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://s.trunk-travelplanner.com/notify/feedback',
    body := jsonb_build_object('record', jsonb_build_object('body', new.body, 'where_from', new.where_from, 'created_at', new.created_at)),
    headers := jsonb_build_object('content-type', 'application/json', 'x-notify-secret', '__NOTIFY_SECRET__')
  );
  return new;
exception when others then
  return new;  -- 知らせが送れなくても、要望の保存は止めない
end;
$$;
revoke all on function public.feedback_notify() from public;

drop trigger if exists feedback_notify on public.feedback;
create trigger feedback_notify after insert on public.feedback for each row execute function public.feedback_notify();
