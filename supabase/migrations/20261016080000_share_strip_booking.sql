-- 共有ページに予約番号と予約管理ページのURLを渡さない（2026-10-16）
-- リンクを知った人に、予約を変更・キャンセルされないように。宿（hotels）の confirmation と url を外す
create or replace function public.get_share(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'data', (t.data - 'emergency' - 'expenses' - 'gmailLabel' - 'shareUrl' - 'shareUpdatedAt' - 'packingBy')
            || jsonb_build_object('hotels', coalesce((
                 select jsonb_agg(h - 'confirmation' - 'url')
                 from jsonb_array_elements(case when jsonb_typeof(t.data -> 'hotels') = 'array' then t.data -> 'hotels' else '[]'::jsonb end) h
               ), '[]'::jsonb)),
    'updatedAt', t.updated_at)
  from public.shares s join public.trips t on t.id = s.trip_id
  where s.token = p_token and s.enabled
$$;
revoke all on function public.get_share(text) from public;
grant execute on function public.get_share(text) to anon, authenticated;
