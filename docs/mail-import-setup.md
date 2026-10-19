# 予約メールの転送取り込み：準備の手順

アプリ・サーバーの仕組みは作ってあります（アプリでは `FEATURES.mailImport = false` で隠している）。
下の 1〜5 をご本人に進めてもらえば、6 で Claude が仕上げます。鍵やパスワードは Claude に見せず、ご自身で入れてください。

---

## 1. データベースに表を足す（Supabase）
1. Supabase のダッシュボード → プロジェクト trunk → SQL Editor
2. `supabase/migrations/20261019000000_mail_import.sql` の中身を貼って Run（Claude がクリップボードに入れます）
3. 続けて `supabase/tests/mail_import_test.sql` を貼って Run。`RESULT: 1 ok; 2 ok; 3 ok; 4 ok; 5 ok;` と出れば成功（最後にわざとエラーにして、テストの跡は残りません）

## 2. AI の API キー（Anthropic）
1. https://console.anthropic.com にログイン（なければ作る）
2. Billing でクレジットを入れ、**月の上限（Spend limit）を 1,500円〜3,000円ほど**に設定する
3. API Keys →「Create Key」で名前を「trunk-mail-import」にして作る
4. ターミナルで次を実行し、聞かれたらキーを貼る（画面には出ません）
   ```
   cd ~/Documents/travel-planner
   read -s K && npx supabase@2.121.0 secrets set ANTHROPIC_API_KEY=$K --project-ref nlstbgnflnchjpnqnelr; unset K
   ```

## 3. メールを受け取る仕組み（Cloudflare）
1. https://dash.cloudflare.com でアカウントを作る（無料）
2. 「サイトを追加」→ `trunk-travelplanner.com` → **Free プラン**
3. 読み込まれた DNS の記録を確かめる：
   - A レコード 4つ（185.199.108.153 / .109.153 / .110.153 / .111.153）
   - www の CNAME（genereoyuna-beep.github.io）
   - どちらも**雲のマークを灰色（DNS only）**にする（GitHub Pages の https 証明書をそのまま使うため）
4. 表示される Cloudflare のネームサーバー2つを、**お名前.com**の「ネームサーバーの変更」に入れる（今は dnsv.jp）
5. 数時間〜1日で Cloudflare 側が「有効」になる。サイトがいつもどおり開くことを確かめる

## 4. 2つの仕組みをつなぐ合言葉
ターミナルで次を実行する（合言葉を作って、Supabase と Cloudflare の両方に入れる。画面には出ません）
```
cd ~/Documents/travel-planner/cloudflare/inbound-worker
npx wrangler login
S=$(openssl rand -hex 24); npx supabase@2.121.0 secrets set INBOUND_SECRET=$S --project-ref nlstbgnflnchjpnqnelr --workdir ../..; echo $S | npx wrangler secret put INBOUND_SECRET; unset S
npx wrangler deploy
```

## 5. メールの転送先の設定（Cloudflare）
1. Cloudflare の trunk-travelplanner.com →「Email」→「Email Routing」を有効にする
2. 「設定」で**サブドメイン `in.trunk-travelplanner.com`** を追加する（必要な DNS は Cloudflare が自動で足す）
3. 「ルーティングルール」→「キャッチオール」→ 動作を「**Worker に送信**」、Worker は `trunk-inbound` にして有効にする

## 6. 仕上げ（Claude）
- アプリで `FEATURES.mailImport = true` にして公開
- 実際の予約メールを1通転送して、読み取り〜反映まで確かめる
- プライバシーポリシー（メールの本文を AI で読み取ること・3日で消すこと）、使い方ガイド、LP の料金の説明を更新

---

## 費用の目安
- AI：メール1通あたり約0.1円（Claude Haiku 5.5）。読み取りの精度が足りないときは Supabase の `MAIL_IMPORT_MODEL` を `claude-opus-5-5`（約3円）にする
- Cloudflare：無料
- 1人1日30通まで受け付ける（使いすぎ防止）
