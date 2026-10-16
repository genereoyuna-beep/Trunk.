-- 無料の枠とパスを、アプリではなく保存先で確かめる（2026-10-15）
-- 決まり：
--   ・無料で同時に準備できる旅行は1つ。終わった旅行と、パスで準備している旅行は数えない
--   ・始まった旅行（開始日を過ぎた旅行）の日程を「今日より後ろ」へ動かしたり、
--     始まった時点の帰る日より30日を超えて延ばしたり、日付を消したりすると「新しい旅行」として数える。
--     付いていたパスはそこで使い終わり
--   ・旅行の日付（start_date / end_date）は、保存先が旅行の中身（data）から計算する。アプリからは書けない
--   ・パス（passes）は支払いの仕組み（Stripe）だけが作る。アプリからは読むだけ

-- ============ パス ============
create table if not exists public.passes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  kind           text not null check (kind in ('trip', '3m')),
  valid_until    timestamptz,                 -- 3か月パスの期限
  used_at        timestamptz,                 -- 旅行パスを旅行に使った日時（一度使うと戻らない）
  stripe_session text unique,
  created_at     timestamptz not null default now()
);
create index if not exists passes_user_idx on public.passes (user_id, kind);
alter table public.passes enable row level security;
create policy "passes: 本人だけ読む" on public.passes for select to authenticated using (user_id = auth.uid());
grant select on public.passes to authenticated;

-- ============ 旅行に足す列（保存先だけが書く） ============
alter table public.trips add column if not exists pass_id     uuid references public.passes(id) on delete set null;
alter table public.trips add column if not exists started_on  date;  -- 始まったときの開始日
alter table public.trips add column if not exists planned_end date;  -- 始まったときの帰る日

-- 旅行の中身から、最初の日と最後の日を出す（アプリの tripRange と同じ数え方）
create or replace function public.trip_dates(d jsonb, out s date, out e date)
language plpgsql immutable as $$
declare el jsonb; a date; b date; n int;
begin
  if jsonb_typeof(d -> 'itinerary') <> 'array' then return; end if;
  for el in select * from jsonb_array_elements(d -> 'itinerary') loop
    begin
      if coalesce(el ->> 'type', '') <> 'transit' then
        if (el ->> 'startDate') ~ '^\d{4}-\d{2}-\d{2}$' then
          a := (el ->> 'startDate')::date;
          n := case when (el ->> 'nights') ~ '^\d+(\.\d+)?$' then floor((el ->> 'nights')::numeric)::int else 0 end;
          b := a + greatest(1, n);
          s := least(coalesce(s, a), a); e := greatest(coalesce(e, b), b);
        end if;
      else
        if (el ->> 'departDate') ~ '^\d{4}-\d{2}-\d{2}$' then
          a := (el ->> 'departDate')::date; s := least(coalesce(s, a), a); e := greatest(coalesce(e, a), a);
        end if;
        if (el ->> 'arriveDate') ~ '^\d{4}-\d{2}-\d{2}$' then
          a := (el ->> 'arriveDate')::date; s := least(coalesce(s, a), a); e := greatest(coalesce(e, a), a);
        end if;
      end if;
    exception when others then null;  -- 2月30日のような日付は飛ばす
    end;
  end loop;
end $$;

create or replace function public.trips_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  r record; old_active boolean; new_active boolean; renewed boolean := false; p uuid; n int;
begin
  -- 同じ人の保存が同時に来ても数え間違えないように
  perform pg_advisory_xact_lock(hashtext(coalesce(new.owner_id, auth.uid())::text));
  select * into r from public.trip_dates(new.data);
  new.start_date := r.s; new.end_date := r.e;
  new_active := new.end_date is null or new.end_date >= today;

  if tg_op = 'INSERT' then
    new.pass_id := null; new.started_on := null; new.planned_end := null;
    old_active := false;
  else
    new.owner_id := old.owner_id; new.pass_id := old.pass_id;
    new.started_on := old.started_on; new.planned_end := old.planned_end;
    -- 始まっていたら、そのときの日程を覚えておく
    if new.started_on is null and old.start_date is not null and old.start_date <= today then
      new.started_on := old.start_date; new.planned_end := old.end_date;
    end if;
    old_active := old.end_date is null or old.end_date >= today;
    if new.started_on is not null and (new.start_date is null or new.start_date > today or new.end_date > new.planned_end + 30) then
      renewed := true;
      new.pass_id := null; new.started_on := null; new.planned_end := null;
    end if;
  end if;

  if new_active and new.pass_id is null and (renewed or not old_active) then
    -- 3か月パスの期間中なら、そのパスで準備する
    select id into p from public.passes
      where user_id = new.owner_id and kind = '3m' and valid_until > now() order by valid_until desc limit 1;
    if p is not null then
      new.pass_id := p;
    else
      select count(*) into n from public.trips t
        where t.owner_id = new.owner_id and t.id <> new.id and t.pass_id is null
          and (t.end_date is null or t.end_date >= today);
      if n >= 1 then
        -- まだ使っていない旅行パスがあれば、この旅行に使う
        select id into p from public.passes
          where user_id = new.owner_id and kind = 'trip' and used_at is null order by created_at limit 1 for update;
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

drop trigger if exists trips_guard on public.trips;
create trigger trips_guard before insert or update on public.trips for each row execute function public.trips_guard();

-- アプリから書けるのは、名前と中身だけ
revoke insert, update on public.trips from authenticated;
grant insert (id, name, data) on public.trips to authenticated;
grant update (id, name, data) on public.trips to authenticated;  -- upsert は id も書き直す形になるため

-- 今ある旅行の日付を、新しい数え方で計算し直す
update public.trips set data = data;
