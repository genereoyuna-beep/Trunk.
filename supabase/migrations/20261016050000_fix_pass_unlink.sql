-- パスを消したのに、旅行に「パスあり」の記録が残っていた不具合の直し（2026-10-16）
-- 原因：trips_guard が更新のたびに pass_id を前の値に戻していたため、passes を消したときの「空にする」更新まで打ち消していた
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
    -- pass_id はアプリから書けない（列の権限）。変わるのはパスが消えたとき（on delete set null）だけなので、そのまま通す
    new.owner_id := old.owner_id;
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

-- すでに残ってしまった記録を空にする
update public.trips t set pass_id = null
  where t.pass_id is not null and not exists (select 1 from public.passes p where p.id = t.pass_id);
select count(*) as パスなしに戻した旅行 from public.trips where pass_id is null;
