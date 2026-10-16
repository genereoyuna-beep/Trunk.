-- 共同編集（2026-10-16）
-- ・招待リンクを開いて Google でログインした人は、その旅行の「同行者」になり、一緒に編集できる（無料）
-- ・同行者として参加した旅行は、その人の無料の枠には数えない（数えるのは作った人＝owner_id の旅行だけ）
-- ・旅行を消せるのは作った人だけ。同行者は「抜ける」だけ
-- ・同時に編集しても上書きしないように、保存は版番号（version）を確かめる save_trip を通す

-- ============ 版番号 ============
alter table public.trips add column if not exists version int not null default 1;
create or replace function public.trips_version() returns trigger language plpgsql as $$
begin new.version := old.version + 1; return new; end $$;
drop trigger if exists trips_version on public.trips;
create trigger trips_version before update on public.trips for each row execute function public.trips_version();

-- ============ 同行者 ============
create table if not exists public.trip_members (
  trip_id      uuid not null references public.trips(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '同行者',
  joined_at    timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index if not exists trip_members_user_idx on public.trip_members (user_id);

-- 作った人か同行者なら true（表どうしの RLS が互いを参照して止まらないよう、関数にまとめる）
create or replace function public.can_edit_trip(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trips where id = p_trip and owner_id = auth.uid())
      or exists (select 1 from public.trip_members where trip_id = p_trip and user_id = auth.uid())
$$;
revoke all on function public.can_edit_trip(uuid) from public;
grant execute on function public.can_edit_trip(uuid) to authenticated;

drop policy if exists "trips: 本人だけ読む" on public.trips;
drop policy if exists "trips: 本人だけ直す" on public.trips;
create policy "trips: 本人と同行者が読む" on public.trips for select to authenticated using (public.can_edit_trip(id));
create policy "trips: 本人と同行者が直す" on public.trips for update to authenticated using (public.can_edit_trip(id)) with check (public.can_edit_trip(id));

alter table public.trip_members enable row level security;
create policy "members: 同じ旅行の人が読む" on public.trip_members for select to authenticated using (public.can_edit_trip(trip_id));
create policy "members: 自分で抜ける・作った人が外す" on public.trip_members for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
grant select, delete on public.trip_members to authenticated;

-- ============ 招待リンク ============
create table if not exists public.trip_invites (
  token      text primary key default encode(extensions.gen_random_bytes(12), 'hex'),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index if not exists trip_invites_trip_idx on public.trip_invites (trip_id);
alter table public.trip_invites enable row level security;
create policy "invites: 旅行の人が読む" on public.trip_invites for select to authenticated using (public.can_edit_trip(trip_id));
create policy "invites: 旅行の人が作る" on public.trip_invites for insert to authenticated with check (public.can_edit_trip(trip_id) and created_by = auth.uid());
create policy "invites: 旅行の人が止める" on public.trip_invites for update to authenticated using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));
grant select on public.trip_invites to authenticated;
grant insert (trip_id) on public.trip_invites to authenticated;
grant update (enabled) on public.trip_invites to authenticated;

-- 招待を受ける。参加した旅行の id を返す。1つの旅行に参加できるのは作った人を入れて10人まで
create or replace function public.accept_invite(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_trip uuid; v_owner uuid; v_name text; n int;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  select i.trip_id, t.owner_id into v_trip, v_owner
    from public.trip_invites i join public.trips t on t.id = i.trip_id
    where i.token = p_token and i.enabled and i.expires_at > now();
  if v_trip is null then raise exception 'invite_invalid'; end if;
  if v_owner = auth.uid() or exists (select 1 from public.trip_members where trip_id = v_trip and user_id = auth.uid()) then
    return v_trip;
  end if;
  select count(*) into n from public.trip_members where trip_id = v_trip;
  if n >= 9 then raise exception 'members_full'; end if;
  select coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), '同行者') into v_name from auth.users u where u.id = auth.uid();
  insert into public.trip_members (trip_id, user_id, display_name) values (v_trip, auth.uid(), left(v_name, 40));
  return v_trip;
end $$;
revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

-- 旅行の顔ぶれ（作った人＋同行者）。名前は Google アカウントの表示名
create or replace function public.trip_people(p_trip uuid) returns table (user_id uuid, display_name text, is_owner boolean)
language sql stable security definer set search_path = public as $$
  select t.owner_id, coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), '作った人'), true
    from public.trips t join auth.users u on u.id = t.owner_id
    where t.id = p_trip and public.can_edit_trip(p_trip)
  union all
  select m.user_id, m.display_name, false from public.trip_members m
    where m.trip_id = p_trip and public.can_edit_trip(p_trip)
$$;
revoke all on function public.trip_people(uuid) from public;
grant execute on function public.trip_people(uuid) to authenticated;

-- ============ 保存（版番号つき） ============
-- p_version が null なら新しい旅行として作る。版番号が違えば 'conflict'（アプリが最新を読み直して、自分の変更を重ね直す）
create or replace function public.save_trip(p_id uuid, p_name text, p_data jsonb, p_version int) returns int
language plpgsql security invoker set search_path = public as $$
declare v int;
begin
  if p_version is null then
    insert into public.trips (id, name, data) values (p_id, p_name, p_data) returning version into v;
    return v;
  end if;
  update public.trips set name = p_name, data = p_data where id = p_id and version = p_version returning version into v;
  if v is null then
    if exists (select 1 from public.trips where id = p_id) then raise exception 'conflict'; end if;
    raise exception 'gone';
  end if;
  return v;
end $$;
revoke all on function public.save_trip(uuid, text, jsonb, int) from public;
grant execute on function public.save_trip(uuid, text, jsonb, int) to authenticated;
