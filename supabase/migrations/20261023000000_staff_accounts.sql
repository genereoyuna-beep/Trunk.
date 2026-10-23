-- 関係者（本人・テスト用）のアカウントを、毎朝の数字から外す（2026-10-23）
-- 表に入るのはアカウントの番号だけ（メールアドレスは入れない）。アプリからは読み書きできない（権限を付けない）
create table if not exists public.staff_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.staff_accounts enable row level security;
revoke all on public.staff_accounts from anon, authenticated;

-- 毎朝の数字：関係者を外して数える。合言葉は要望の知らせ（feedback_notify）から取り出して使う（ここには書かない）
do $$
declare sec text;
begin
  sec := substring(pg_get_functiondef('public.feedback_notify()'::regprocedure) from '''x-notify-secret'', ''([0-9a-f]+)''');
  if sec is null then raise exception '要望の知らせ（feedback_notify）の合言葉が見つかりません'; end if;
  execute format($f$
    create or replace function public.daily_digest() returns void
    language plpgsql security definer set search_path = public, extensions as $b$
    declare
      d1 timestamptz := date_trunc('day', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo';
      d0 timestamptz := d1 - interval '1 day';
      body jsonb;
    begin
      body := jsonb_build_object(
        'day', to_char(d0 at time zone 'Asia/Tokyo', 'YYYY-MM-DD'),
        'staff', (select count(*) from staff_accounts),
        'users_total', (select count(*) from auth.users u where u.id not in (select user_id from staff_accounts)),
        'users_new', (select count(*) from auth.users u where u.created_at >= d0 and u.created_at < d1 and u.id not in (select user_id from staff_accounts)),
        'editors', (select count(distinct owner_id) from trips where updated_at >= d0 and updated_at < d1 and owner_id not in (select user_id from staff_accounts)),
        'returning', (select count(distinct t.owner_id) from trips t join auth.users u on u.id = t.owner_id
                      where t.updated_at >= d0 and t.updated_at < d1 and u.created_at < d0 and t.owner_id not in (select user_id from staff_accounts)),
        'no_trip', (select count(*) from auth.users u where not exists (select 1 from trips t where t.owner_id = u.id) and u.id not in (select user_id from staff_accounts)),
        'trips_total', (select count(*) from trips where owner_id not in (select user_id from staff_accounts)),
        'trips_new', (select count(*) from trips where created_at >= d0 and created_at < d1 and owner_id not in (select user_id from staff_accounts)),
        'with_plans', (select count(*) from trips where jsonb_array_length(coalesce(data->'localTransport', '[]'::jsonb)) > 0 and owner_id not in (select user_id from staff_accounts)),
        'with_hotel', (select count(*) from trips where exists (select 1 from jsonb_array_elements(coalesce(data->'hotels', '[]'::jsonb)) h where coalesce(h->>'name', '') <> '') and owner_id not in (select user_id from staff_accounts)),
        'with_expense', (select count(*) from trips where jsonb_array_length(coalesce(data->'expenses', '[]'::jsonb)) > 0 and owner_id not in (select user_id from staff_accounts)),
        'shares_new', (select count(*) from shares where created_at >= d0 and created_at < d1 and owner_id not in (select user_id from staff_accounts)),
        'invites_new', (select count(*) from trip_invites where created_at >= d0 and created_at < d1 and created_by not in (select user_id from staff_accounts)),
        'feedback_new', (select count(*) from feedback where created_at >= d0 and created_at < d1 and user_id not in (select user_id from staff_accounts)),
        'passes_new', (select count(*) from passes where created_at >= d0 and created_at < d1 and user_id not in (select user_id from staff_accounts)),
        'mail_new', (select count(*) from inbound_items where received_at >= d0 and received_at < d1 and user_id not in (select user_id from staff_accounts))
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
