-- 有料パスの購入（2026-10-16）：割引コードと支払った金額を残す（割引は1人1回の確認に使う）
alter table public.passes add column if not exists promo_code text;
alter table public.passes add column if not exists amount int;
