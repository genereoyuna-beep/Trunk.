-- 見る専用の共有リンク（2026-10-16）
-- 共有ページはいつも最新の旅程を見せる（保存のたびに写しを作らない）。
-- 渡さないもの：緊急時の情報（パスポート・保険・連絡先）、支出の記録、Gmail のラベル、同行者それぞれの持ち物
create or replace function public.get_share(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'data', t.data - 'emergency' - 'expenses' - 'gmailLabel' - 'shareUrl' - 'shareUpdatedAt' - 'packingBy',
    'updatedAt', t.updated_at)
  from public.shares s join public.trips t on t.id = s.trip_id
  where s.token = p_token and s.enabled
$$;
revoke all on function public.get_share(text) from public;
grant execute on function public.get_share(text) to anon, authenticated;
