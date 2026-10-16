// 使い方: npm run build の中で呼ばれる → ../s/index.html（共有ページ、/s/?k=トークン）
// 見る専用。ログインしない人が開くので、検索には出さない（noindex）。
const Babel = require('@babel/standalone');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || path.resolve(__dirname, '../s/index.html');
const S = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const pre = 'window.__SHARE_LIVE__ = true;\n';
const src = pre + ['src/trunk-config.js', 'shared/model.js', 'shared/phrase-data.js', 'shared/world-data.js', 'shared/map.jsx', 'shared/app.jsx', 'shared/extras.jsx', 'shared/phrases.jsx', 'shared/shiori.jsx', 'shared/share.jsx', 'src/share-root.jsx'].map(S).join('\n');
const code = Babel.transform(src, { presets: ['react'] }).code.replace(/<\/script/gi, '<\\/script');
const css = S('shared/style.css') + '\n.share-ro button{cursor:default}.share-ro .stayrow:hover{box-shadow:none}.share-ro .moverow:hover{background:none}\n';
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Trunk.</title>
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<link rel="icon" href="/icon.png">
<link rel="apple-touch-icon" href="/icons/trunk-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap">
<style>
${css}
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
