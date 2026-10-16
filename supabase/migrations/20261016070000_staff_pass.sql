-- 運営者パス（2026-10-16）：運営者のアカウントだけに保存先で直接付ける、期限なし・旅行いくつでものパス。
-- 支払いの仕組みからは作られない（kind = 'staff'）。出発期限（購入から1年）もかからない
alter table public.passes drop constraint if exists passes_kind_check;
alter table public.passes add constraint passes_kind_check check (kind in ('trip', '3m', 'staff'));

create or replace function public.trips_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  r record; old_active boolean; new_active boolean; renewed boolean := false; p uuid; n int; pr record; dl date;
begin
  -- 同じ人の保存が同時に来ても数え間違えないように
  perform pg_advisory_xact_lock(hashtext(coalesce(new.owner_id, auth.uid())::text));
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
