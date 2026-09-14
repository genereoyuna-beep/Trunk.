# Trunk. 旅行プランナー

旅行の日程管理・割り勘・持ち物リストを一括管理できる無料Webアプリ。

## Supabase セットアップ（共有機能）

### 1. Supabaseプロジェクト作成

1. [https://supabase.com](https://supabase.com) でアカウント作成
2. 「New project」でプロジェクトを作成
3. プロジェクトの「Settings > API」から以下をコピー：
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** キー

### 2. テーブル作成

Supabaseの「SQL Editor」で以下を実行：

```sql
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select" ON trips
  FOR SELECT USING (true);

CREATE POLICY "trips_insert" ON trips
  FOR INSERT WITH CHECK (true);
```

### 3. アプリに設定を反映

`app/index.html` の先頭付近にある以下の行を書き換える：

```javascript
const SB_URL = 'YOUR_SUPABASE_URL';   // ← Project URLに変更
const SB_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ← anon keyに変更
```

> **Note:** Supabaseのanon keyはRLSで保護されているため、クライアントサイドへの記述は公式に推奨されています。

### 4. Google Maps API キー

`app/index.html` の `MAPS_API_KEY` にGoogle Cloud ConsoleのAPIキーを設定。
HTTPリファラー制限 `https://trunk-travelplanner.com/*` を必ず設定すること。

## Google ログイン設定（マイ旅程機能）

Googleアカウントでログインすると、1つのアカウントで複数の旅程を管理できます（「マイ旅程」）。
**ログインは任意**で、共有リンクを受け取っただけの人は今まで通りログイン不要で閲覧・編集できます。

### 1. `trips` テーブルにカラムを追加 + RLSを見直す

既存の`trips`テーブルは`SELECT USING (true)`になっており、匿名キーで全行を一覧取得できてしまう
（IDを知らない他人の旅程も読めてしまう）ため、この機会に「IDを知っている人だけが読める」形に閉じます。
Supabaseの「SQL Editor」で以下を実行してください。

```sql
-- オーナー情報・タイトル・更新日時を追加
alter table trips add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table trips add column if not exists title text;
alter table trips add column if not exists updated_at timestamptz not null default now();

-- 既存ポリシーを一旦削除
drop policy if exists trips_select on trips;
drop policy if exists trips_insert on trips;

-- オーナーは自分の旅程一覧を直接読める（「マイ旅程」ダッシュボード用）
create policy trips_select_own on trips
  for select using (owner_id = auth.uid());

-- 誰でも作成できる（未ログインでの共有作成も維持）。他人のowner_idを騙ることはできない
create policy trips_insert on trips
  for insert with check (owner_id is null or owner_id = auth.uid());

-- 更新・削除はオーナー本人のみ
create policy trips_update_own on trips
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy trips_delete_own on trips
  for delete using (owner_id = auth.uid());

-- 共有リンク（/t/{id}）用: IDを知っている人だけがピンポイントで読める関数
-- security definer によりRLSを迂回するが、完全一致するidの行しか返せないため一覧化はできない
create or replace function get_trip(trip_id text)
returns table(data jsonb, title text, owner_id uuid)
language sql
security definer
set search_path = public
as $$
  select data, title, owner_id from trips where id = trip_id;
$$;

grant execute on function get_trip(text) to anon, authenticated;
```

### 2. Google Cloud Console でOAuthクライアントを作成

1. [Google Cloud Console](https://console.cloud.google.com/) → 「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuthクライアントID」→ アプリケーションの種類は**ウェブアプリケーション**
3. 「承認済みのリダイレクトURI」に、Supabaseダッシュボードの `Authentication > Providers > Google` に表示されている
   コールバックURL（`https://<プロジェクトref>.supabase.co/auth/v1/callback` の形式）を貼り付け
4. 作成後に表示される **クライアントID** と **クライアントシークレット** をコピー

### 3. Supabase側でGoogleプロバイダを有効化

1. Supabaseダッシュボード →「Authentication」→「Providers」→「Google」を有効化
2. 手順2で取得したクライアントID・シークレットを貼り付けて保存
3. 「Authentication」→「URL Configuration」の **Redirect URLs** に
   `https://trunk-travelplanner.com/app/` を追加（ここに登録されていないURLへはリダイレクトされません）

設定が完了すると、アプリ右上に「ログイン」ボタンが表示されます。

## 共有・マイ旅程URL の仕組み

- **未ログイン、または他人の旅程を編集して共有した場合**：共有ボタン押下 → Supabaseの`trips`テーブルに
  新しい行として保存（`owner_id`はnull）→ `https://trunk-travelplanner.com/t/{7文字ID}` を生成。
  スナップショットなので、再度共有すると別IDの新しい行が発行される（今まで通りログイン不要）。
- **ログインして自分の旅程を編集中の場合**：編集内容は自動的に同じ行へ上書き保存される（ライブ反映）。
  共有URLは`#t/{id}`のまま固定され、常に最新の内容を表示する。閲覧・編集する側はログイン不要。
- `/t/{id}` アクセス時 → GitHub Pagesの `404.html` が `/app/#t/{id}` にリダイレクト → アプリが
  `get_trip` 関数経由でSupabaseから取得して表示（オーナー本人がアクセスした場合はそのままマイ旅程として編集を継続）

## ローカル開発

```bash
# 静的ファイルなのでそのままブラウザで開くだけ
open index.html
```
