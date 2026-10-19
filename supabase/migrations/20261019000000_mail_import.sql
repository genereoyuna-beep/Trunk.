-- 予約メールの転送取り込み（パスを持っている人だけ）
-- 1人1つの推測できない転送用アドレス（token@in.trunk-travelplanner.com）を発行し、
-- 届いたメールはサーバー（Edge Function inbound-email）だけが書き込む。本文は数日で消し、読み取った結果だけ残す。

-- ============ 使えるかどうか ============
-- 3か月パス・運営者パスが有効、または旅行パスを使っている旅行がまだ終わっていない
create or replace function public.has_mail_import(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.passes p
    where p.user_id = uid and p.kind in ('3m', 'staff') and (p.valid_until is null or p.valid_until > now())
  ) or exists (
    select 1 from public.trips t join public.passes p on p.id = t.pass_id
    where t.owner_id = uid and p.kind = 'trip' and coalesce(t.end_date, current_date) >= current_date
  );
$$;
revoke all on function public.has_mail_import(uuid) from public;
grant execute on function public.has_mail_import(uuid) to service_role;

-- ============ 転送用アドレス ============
create table if not exists public.inbound_addresses (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  token      text not null unique,
  created_at timestamptz not null default now()
);
alter table public.inbound_addresses enable row level security;
create policy "inbound_addresses: 本人だけ読む" on public.inbound_addresses for select to authenticated using (user_id = auth.uid());
grant select on public.inbound_addresses to authenticated;

-- 自分の転送用アドレスを返す（なければ作る）。使えない人には not_paid
create or replace function public.my_inbound_address()
returns text language plpgsql security definer set search_path = public as $$
declare tok text;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not public.has_mail_import(auth.uid()) then raise exception 'not_paid'; end if;
  select token into tok from public.inbound_addresses where user_id = auth.uid();
  if tok is null then
    loop
      tok := lower(substr(translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/=', ''), 1, 10));
      exit when tok ~ '^[a-z0-9]{10}$' and not exists (select 1 from public.inbound_addresses where token = tok);
    end loop;
    insert into public.inbound_addresses (user_id, token) values (auth.uid(), tok);
  end if;
  return tok;
end;
$$;
revoke all on function public.my_inbound_address() from public;
grant execute on function public.my_inbound_address() to authenticated;

-- 使えるかどうかを、アプリから確かめる
create or replace function public.can_mail_import()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.has_mail_import(auth.uid());
$$;
revoke all on function public.can_mail_import() from public;
grant execute on function public.can_mail_import() to authenticated;

-- ============ 届いたメール（取り込み候補） ============
create table if not exists public.inbound_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  received_at     timestamptz not null default now(),
  from_addr       text,
  subject         text,
  body            text,                 -- 読み取り後、数日で消す
  parsed          jsonb,                -- AI が読み取った予約の内容
  kind            text not null default 'booking' check (kind in ('booking', 'gmail_confirm')),
  status          text not null default 'pending' check (status in ('pending', 'parsed', 'failed', 'applied', 'dismissed')),
  error           text,
  body_deleted_at timestamptz
);
create index if not exists inbound_items_user_idx on public.inbound_items (user_id, received_at desc);
alter table public.inbound_items enable row level security;
create policy "inbound_items: 本人だけ読む" on public.inbound_items for select to authenticated using (user_id = auth.uid());
create policy "inbound_items: 本人だけ状態を変える" on public.inbound_items for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- アプリからは状態（取り込んだ・いらない）だけ変えられる。本文や読み取り結果は書けない
grant select on public.inbound_items to authenticated;
grant update (status) on public.inbound_items to authenticated;

grant all on public.inbound_addresses, public.inbound_items to service_role;
