-- 共同編集の直し（2026-10-16）
-- 新しい旅行を作ると「row-level security」で止まっていた。読む・直す決まりが関数（can_edit_trip）で trips 表を探しに行くが、
-- 作ったばかりの行はその関数からまだ見えないため。作った人かどうかは行そのもの（owner_id）で確かめ、同行者だけ表を引く。
create or replace function public.is_trip_member(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trip_members where trip_id = p_trip and user_id = auth.uid())
$$;
revoke all on function public.is_trip_member(uuid) from public;
grant execute on function public.is_trip_member(uuid) to authenticated;

drop policy if exists "trips: 本人と同行者が読む" on public.trips;
drop policy if exists "trips: 本人と同行者が直す" on public.trips;
create policy "trips: 本人と同行者が読む" on public.trips for select to authenticated
  using (owner_id = auth.uid() or public.is_trip_member(id));
create policy "trips: 本人と同行者が直す" on public.trips for update to authenticated
  using (owner_id = auth.uid() or public.is_trip_member(id))
  with check (owner_id = auth.uid() or public.is_trip_member(id));
