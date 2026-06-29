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

## 共有URL の仕組み

- 共有ボタン押下 → Supabaseの`trips`テーブルに保存 → `https://trunk-travelplanner.com/t/{7文字ID}` を生成
- `/t/{id}` アクセス時 → GitHub Pagesの `404.html` が `/app/#t/{id}` にリダイレクト → アプリがSupabaseから取得して表示

## ローカル開発

```bash
# 静的ファイルなのでそのままブラウザで開くだけ
open index.html
```
