// 使い方: npm install のあと npm run build → ../beta/index.html ができる（公開前の確認用）
// アプリ本体はアーティファクト版と共通（shared/、node sync.js で更新）。Trunk. だけの部分は src/。
const Babel = require('@babel/standalone');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || path.resolve(__dirname, '../beta/index.html');
const S = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const src = ['src/trunk-config.js', 'shared/model.js', 'shared/world-data.js', 'shared/map.jsx', 'src/store.js', 'shared/app.jsx', 'shared/extras.jsx', 'shared/phrases.jsx', 'shared/shiori.jsx', 'src/trunk.jsx'].map(S).join('\n');
const code = Babel.transform(src, { presets: ['react'] }).code.replace(/<\/script/gi, '<\\/script');
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Trunk.</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spline+Sans+Mono:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap">
<style>
${S('shared/style.css')}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
</head>
<body>
<div id="root"><p style="padding:80px 16px;text-align:center;color:#5A6470">読み込み中…</p></div>
<script>
${code}
</script>
</body>
</html>
`;
if (/genereoyuna|@gmail\.com/i.test(html)) { console.error('個人のメールアドレスが含まれています。中止します'); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('built', out, html.length);
