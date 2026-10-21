-- 毎朝8時（日本時間）に、前の日の数字を運営者にメールで送る（2026-10-21）
-- 送るのは数だけ（名前・メールアドレス・旅行の中身は送らない）。
-- 合言葉は、すでに入っている要望の知らせ（feedback_notify）から取り出して使う（ここには書かない）。
create extension if not exists pg_cron;

do $$
declare sec text;
begin
  sec := substring(pg_get_functiondef('public.feedback_notify()'::regprocedure) from '''x-notify-secret'', ''([0-9a-f]+)''');
  if sec is null then raise exception '要望の知らせ（feedback_notify）の合言葉が見つかりません。先に 20261021000000_feedback_notify.sql を流してください'; end if;
  execute format($f$
    create or replace function public.daily_digest() returns void
    language plpgsql security definer set search_path = public, extensions as $b$
    declare
      d1 timestamptz := date_trunc('day', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo';  -- 今日の0時（日本時間）
      d0 timestamptz := d1 - interval '1 day';                                                         -- 昨日の0時
      body jsonb;
    begin
      body := jsonb_build_object(
        'day', to_char(d0 at time zone 'Asia/Tokyo', 'YYYY-MM-DD'),
        -- 人
        'users_total', (select count(*) from auth.users),
        'users_new', (select count(*) from auth.users where created_at >= d0 and created_at < d1),
        'editors', (select count(distinct owner_id) from trips where updated_at >= d0 and updated_at < d1),
        'returning', (select count(distinct t.owner_id) from trips t join auth.users u on u.id = t.owner_id
                      where t.updated_at >= d0 and t.updated_at < d1 and u.created_at < d0),
        'no_trip', (select count(*) from auth.users u where not exists (select 1 from trips t where t.owner_id = u.id)),
        -- 旅行
        'trips_total', (select count(*) from trips),
        'trips_new', (select count(*) from trips where created_at >= d0 and created_at < d1),
        'with_plans', (select count(*) from trips where jsonb_array_length(coalesce(data->'localTransport', '[]'::jsonb)) > 0),
        'with_hotel', (select count(*) from trips where exists (select 1 from jsonb_array_elements(coalesce(data->'hotels', '[]'::jsonb)) h where coalesce(h->>'name', '') <> '')),
        'with_expense', (select count(*) from trips where jsonb_array_length(coalesce(data->'expenses', '[]'::jsonb)) > 0),
        -- 共有・その他（昨日の分）
        'shares_new', (select count(*) from shares where created_at >= d0 and created_at < d1),
        'invites_new', (select count(*) from trip_invites where created_at >= d0 and created_at < d1),
        'feedback_new', (select count(*) from feedback where created_at >= d0 and created_at < d1),
        'passes_new', (select count(*) from passes where created_at >= d0 and created_at < d1),
        'mail_new', (select count(*) from inbound_items where received_at >= d0 and received_at < d1)
      );
      perform net.http_post(
        url := 'https://s.trunk-travelplanner.com/notify/daily',
        body := body,
        headers := jsonb_build_object('content-type', 'application/json', 'x-notify-secret', %L)
      );
    end;
    $b$;
  $f$, sec);
end $$;
revoke all on function public.daily_digest() from public, anon, authenticated;

-- 毎朝8時（日本時間）＝ 23時（UTC）に送る。同じ名前の予定があれば入れ直す
select cron.unschedule(jobid) from cron.job where jobname = 'trunk-daily-digest';
select cron.schedule('trunk-daily-digest', '0 23 * * *', 'select public.daily_digest()');
