-- 緊急時の情報を人ごとにする・保存の上限（2026-10-16）
-- ・パスポートや保険などの緊急時の情報は、一緒に編集する人にも見えないよう、本人だけが読み書きできる表（trip_private）に置く
-- ・1人が持てる旅行は300件まで、1件の大きさは約2MBまで
-- ・共有ページからのリクエストは、1つの共有リンクにつき1日50件まで。機能の要望は1人1日20件まで

create table if not exists public.trip_private (
  trip_id    uuid not null references public.trips(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  emergency  jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
alter table public.trip_private enable row level security;
create policy "private: 本人だけ" on public.trip_private for all to authenticated
  using (user_id = auth.uid() and public.can_edit_trip(trip_id))
  with check (user_id = auth.uid() and public.can_edit_trip(trip_id));
grant select, insert, update, delete on public.trip_private to authenticated;

create or replace function public.trips_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  r record; old_active boolean; new_active boolean; renewed boolean := false; p uuid; n int; pr record; dl date;
begin
  -- 同じ人の保存が同時に来ても数え間違えないように
  perform pg_advisory_xact_lock(hashtext(coalesce(new.owner_id, auth.uid())::text));
  -- 緊急時の情報は旅行の中身に置かない（人ごとの trip_private へ）。大きすぎる旅行は保存しない
  new.data := new.data - 'emergency';
  if octet_length(new.data::text) > 2000000 then raise exception 'trip_too_large'; end if;
  if tg_op = 'INSERT' then
    select count(*) into n from public.trips where owner_id = coalesce(new.owner_id, auth.uid());
    if n >= 300 then raise exception 'trip_count_limit'; end if;
  end if;
  select * into r from public.trip_dates(new.data);
  new.start_date := r.s; new.end_date := r.e;
  new_active := new.end_date is null or new.end_date >= today;

  if tg_op = 'INSERT' then
    new.pass_id := null; new.started_on := null; new.planned_end := null; new.postponed := false;
    old_active := false;
  else
    -- pass_id はアプリから書けない（列の権限）。変わるのはパスが消えたとき（on delete set null）だけなので、そのまま通す
    new.owner_id := old.owner_id; new.postponed := old.postponed;
    new.started_on := old.started_on; new.planned_end := old.planned_end;
    -- 始まっていたら、そのときの日程を覚えておく
    if new.started_on is null and old.start_date is not null and old.start_date <= today then
      new.started_on := old.start_date; new.planned_end := old.end_date;
    end if;
    old_active := old.end_date is null or old.end_date >= today;
    if new.started_on is not null and (new.start_date is null or new.start_date > today or new.end_date > new.planned_end + 30) then
      if not old.postponed and new.start_date is not null and new.start_date > today and today <= new.started_on + 7 then
        -- 出発してから7日以内の延期（欠航など）は、1つの旅行につき1回だけ、同じ旅行のまま扱う
        new.postponed := true; new.started_on := null; new.planned_end := null;
      else
        renewed := true;
        new.pass_id := null; new.started_on := null; new.planned_end := null; new.postponed := false;
      end if;
    end if;
  end if;

  -- パスの出発期限：購入から1年以内に出発する旅行だけ。期限より後ろにずらしたり、期限が来ても日付が未定だったりすると外れる
  if new.pass_id is not null then
    select kind, created_at, valid_until into pr from public.passes where id = new.pass_id;
    if found and pr.kind <> 'staff' then
      dl := ((pr.created_at at time zone 'Asia/Tokyo') + interval '1 year')::date;
      if (new.start_date is not null and new.start_date > dl)
         or (new.start_date is null and (today > dl or (pr.kind = '3m' and pr.valid_until <= now()))) then
        new.pass_id := null; renewed := true;
      end if;
    end if;
  end if;

  if new_active and new.pass_id is null and (renewed or not old_active) then
    -- 運営者パス（無期限）か、3か月パスの期間中なら、そのパスで準備する
    select id into p from public.passes
      where user_id = new.owner_id and kind = 'staff' and (valid_until is null or valid_until > now())
      limit 1;
    if p is null then select id into p from public.passes
      where user_id = new.owner_id and kind = '3m' and valid_until > now()
        and (new.start_date is null or new.start_date <= ((created_at at time zone 'Asia/Tokyo') + interval '1 year')::date)
      order by valid_until desc limit 1;
    end if;
    if p is not null then
      new.pass_id := p;
    else
      select count(*) into n from public.trips t
        where t.owner_id = new.owner_id and t.id <> new.id and t.pass_id is null
          and (t.end_date is null or t.end_date >= today);
      if n >= 1 then
        -- まだ使っていない旅行パスがあれば、この旅行に使う
        select id into p from public.passes
          where user_id = new.owner_id and kind = 'trip' and used_at is null
            and (new.start_date is null or new.start_date <= ((created_at at time zone 'Asia/Tokyo') + interval '1 year')::date)
          order by created_at limit 1 for update;
        if p is null then
          raise exception 'trip_limit' using hint = '無料で同時に準備できる旅行は1つです';
        end if;
        update public.passes set used_at = now() where id = p;
        new.pass_id := p;
      end if;
    end if;
  end if;
  return new;
end $$;

-- 今ある緊急時の情報を、作った人の trip_private へ移して、旅行の中身から消す
insert into public.trip_private (trip_id, user_id, emergency)
  select id, owner_id, data -> 'emergency' from public.trips
  where jsonb_typeof(data -> 'emergency') = 'object'
on conflict (trip_id, user_id) do nothing;
update public.trips set data = data where data ? 'emergency';

-- 共有ページからのリクエスト：1つの共有リンクにつき1日50件まで
create or replace function public.add_share_request(p_token text, p_name text, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare v_trip uuid; n int;
begin
  select trip_id into v_trip from public.shares where token = p_token and enabled;
  if v_trip is null then raise exception 'share not found'; end if;
  if length(coalesce(p_body, '')) = 0 or length(p_body) > 2000 or length(coalesce(p_name, '')) > 50 then raise exception 'invalid request'; end if;
  select count(*) into n from public.share_requests where share_token = p_token and created_at > now() - interval '1 day';
  if n >= 50 then raise exception 'too_many_requests'; end if;
  insert into public.share_requests (share_token, trip_id, name, body) values (p_token, v_trip, coalesce(p_name, ''), p_body);
end $$;
revoke all on function public.add_share_request(text, text, text) from public;
grant execute on function public.add_share_request(text, text, text) to anon, authenticated;

-- 機能の要望：1人1日20件まで
create or replace function public.feedback_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.feedback where user_id = new.user_id and created_at > now() - interval '1 day';
  if n >= 20 then raise exception 'too_many_requests'; end if;
  return new;
end $$;
drop trigger if exists feedback_limit on public.feedback;
create trigger feedback_limit before insert on public.feedback for each row execute function public.feedback_limit();
