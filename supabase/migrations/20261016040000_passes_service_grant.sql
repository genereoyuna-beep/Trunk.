-- パスを付ける仕組み（Stripe の知らせを受ける関数）が passes 表を読み書きできるようにする（2026-10-16）
-- 表は自動では公開しない設定なので、service_role にも明示して渡す。アプリ（authenticated）は今まで通り読むだけ
grant select, insert, update on public.passes to service_role;
