-- Trunk. 東京プロジェクトの初期設定（2026-10-15）
-- 方針：表は自動では公開されない設定なので、必要な権限だけをここで明示する。
--       どの表も RLS を有効にし、本人のデータしか読み書きできないようにする。

-- 更新日時を自動で入れる
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ============ 旅行 ============
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null default '新しい旅行',
  start_date  date,
  end_date    date,
  data        jsonb not null default '{}'::jsonb,   -- 旅行1件分の中身（滞在・移動・予定・予算・持ち物など）
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists trips_owner_idx on public.trips (owner_id, updated_at desc);
create trigger trips_touch before update on public.trips for each row execute function public.touch_updated_at();

alter table public.trips enable row level security;
create policy "trips: 本人だけ読む"   on public.trips for select to authenticated using (owner_id = auth.uid());
create policy "trips: 本人だけ作る"   on public.trips for insert to authenticated with check (owner_id = auth.uid());
create policy "trips: 本人だけ直す"   on public.trips for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "trips: 本人だけ消す"   on public.trips for delete to authenticated using (owner_id = auth.uid());
grant select, insert, update, delete on public.trips to authenticated;

-- ============ 共有リンク ============
-- token：推測できないランダムな文字列。snapshot：共有用に整えた旅行データ（緊急時の情報・立て替えの明細は入れない）
create table if not exists public.shares (
  token       text primary key default encode(extensions.gen_random_bytes(12), 'hex'),
  trip_id     uuid not null unique references public.trips(id) on delete cascade,
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  snapshot    jsonb not null default '{}'::jsonb,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger shares_touch before update on public.shares for each row execute function public.touch_updated_at();

alter table public.shares enable row level security;
create policy "shares: 本人だけ読む"  on public.shares for select to authenticated using (owner_id = auth.uid());
create policy "shares: 本人だけ作る"  on public.shares for insert to authenticated with check (owner_id = auth.uid() and exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
create policy "shares: 本人だけ直す"  on public.shares for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "shares: 本人だけ消す"  on public.shares for delete to authenticated using (owner_id = auth.uid());
grant select, insert, update, delete on public.shares to authenticated;

-- ログインしていない人は、表を直接は読めない。token を知っているときだけ、この関数で中身を受け取る
create or replace function public.get_share(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('snapshot', s.snapshot, 'updated_at', s.updated_at)
  from public.shares s where s.token = p_token and s.enabled
$$;
revoke all on function public.get_share(text) from public;
grant execute on function public.get_share(text) to anon, authenticated;

-- ============ 同行者からのリクエスト ============
create table if not exists public.share_requests (
  id          uuid primary key default gen_random_uuid(),
  share_token text not null references public.shares(token) on delete cascade,
  trip_id     uuid not null references public.trips(id) on delete cascade,
  name        text not null default '',
  body        text not null,
  status      text not null default 'new' check (status in ('new', 'done', 'dismissed')),
  created_at  timestamptz not null default now()
);
create index if not exists share_requests_trip_idx on public.share_requests (trip_id, created_at desc);

alter table public.share_requests enable row level security;
create policy "requests: 旅行の持ち主だけ読む" on public.share_requests for select to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
create policy "requests: 旅行の持ち主だけ直す" on public.share_requests for update to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
create policy "requests: 旅行の持ち主だけ消す" on public.share_requests for delete to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
grant select, update, delete on public.share_requests to authenticated;

-- 送るのは誰でもできるが、この関数を通す（有効な共有リンクにだけ、長すぎない文で）
create or replace function public.add_share_request(p_token text, p_name text, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare v_trip uuid;
begin
  select trip_id into v_trip from public.shares where token = p_token and enabled;
  if v_trip is null then raise exception 'share not found'; end if;
  if length(coalesce(p_body, '')) = 0 or length(p_body) > 2000 or length(coalesce(p_name, '')) > 50 then raise exception 'invalid request'; end if;
  insert into public.share_requests (share_token, trip_id, name, body) values (p_token, v_trip, coalesce(p_name, ''), p_body);
end $$;
revoke all on function public.add_share_request(text, text, text) from public;
grant execute on function public.add_share_request(text, text, text) to anon, authenticated;

-- ============ 無料プランの自動停止を防ぐための軽い問い合わせ ============
create or replace function public.ping() returns timestamptz language sql stable as $$ select now() $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon;
