-- 機能の要望・不具合の声（2026-10-15）
-- 送れるのはログインした人だけ。読むのは運営だけ（ダッシュボードから）なので、アプリからは読めない。
-- 名前やメールアドレスは入れない。どの画面から送ったか（where_from）と、旅行が終わった後かどうかだけを残す。
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  where_from  text not null default 'settings' check (where_from in ('settings', 'after_trip')),
  created_at  timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;
create policy "feedback: insert own" on public.feedback for insert to authenticated with check (user_id = auth.uid());
grant insert on public.feedback to authenticated;
