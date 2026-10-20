# 要望が届いたらメールで知らせる：準備の手順

アプリの「ほしい機能・困ったこと」に要望が届くと、Gmail に「Trunk. に要望が届きました」と本文つきで届くようにする。
メールアドレスと合言葉は Claude に見せず、ご自身で入れる。

## 1. 送り先のアドレスを確認する（Cloudflare）
1. Cloudflare → trunk-travelplanner.com → Email Routing →「Destination addresses」（送り先アドレス）
2. 受け取りたい Gmail のアドレスを追加する
3. Gmail に届く Cloudflare からの確認メールで「Verify」を押す

## 2. ターミナルで1回だけ実行する
```
cd ~/Documents/travel-planner/cloudflare/share-worker
npx wrangler secret put NOTIFY_TO
```
聞かれたら、1 で確認した Gmail のアドレスを入れる。続けて：
```
S=$(openssl rand -hex 24); echo $S | npx wrangler secret put NOTIFY_SECRET; sed "s/__NOTIFY_SECRET__/$S/" ../../supabase/migrations/20261021000000_feedback_notify.sql | pbcopy; unset S; echo "SQL をクリップボードに入れました"
```
（合言葉を作って Cloudflare に入れ、合言葉入りの SQL をクリップボードに入れる。画面には出ない）

## 3. Supabase で SQL を流す
Supabase → SQL Editor に貼って Run。「Success」と出れば完了。

## 4. 確かめる
アプリの「…」→「アカウント」→「ほしい機能・困ったこと」から、試しに一言送る。1分ほどで Gmail に届けば成功。
