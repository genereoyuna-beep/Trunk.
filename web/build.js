// 使い方: npm install のあと npm run build → ../app/index.html（アプリ本体）と ../s/index.html（共有ページ）ができる
// アプリ本体はアーティファクト版と共通（shared/、node sync.js で更新）。Trunk. だけの部分は src/。
const Babel = require('@babel/standalone');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || path.resolve(__dirname, '../app/index.html');
const S = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const src = ['src/trunk-config.js', 'src/places.js', 'shared/model.js', 'shared/phrase-data.js', 'shared/world-data.js', 'shared/map.jsx', 'src/store.js', 'shared/app.jsx', 'shared/extras.jsx', 'shared/phrases.jsx', 'shared/shiori.jsx', 'shared/consult.jsx', 'src/trunk.jsx'].map(S).join('\n');
const code = Babel.transform(src, { presets: ['react'] }).code.replace(/<\/script/gi, '<\\/script');
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<!-- Google アナリティクス。招待リンクなどの「?」以降は送らない（utm_ だけ残す）。?noga=1 を一度開いた端末では送らない -->
<script>(function(){try{var q=new URLSearchParams(location.search);if(q.get("noga")==="1")localStorage.setItem("trunk-noga","1");if(q.get("noga")==="0")localStorage.removeItem("trunk-noga");if(localStorage.getItem("trunk-noga")==="1"){window.gtag=function(){};return}}catch(e){}window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config","G-7ZYC3Z9MQL",{page_location:location.origin+location.pathname+(function(){var u=new URLSearchParams();new URLSearchParams(location.search).forEach(function(v,k){if(/^utm_/.test(k))u.set(k,v)});var t=u.toString();return t?"?"+t:""})()});addEventListener("load",function(){setTimeout(function(){var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id=G-7ZYC3Z9MQL";document.head.appendChild(s)},1500)})})();</script>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Trunk.</title>
<meta name="description" content="手配もれが見える旅行プランナー。しおりPDFとリンク共有つき。">
<meta property="og:title" content="Trunk. — 旅の段取りを、一日ずつ。">
<meta property="og:description" content="手配もれが見える旅行プランナー。しおりPDFとリンク共有つき。">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Trunk.">
<meta property="og:image" content="https://trunk-travelplanner.com/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="/icon.png">
<link rel="apple-touch-icon" href="/icons/trunk-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#F3F4F1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Trunk.">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap"></noscript>
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
// ホーム画面に追加したとき、アプリのように全画面で開くための設定（アプリと同じフォルダに置く）
fs.writeFileSync(path.join(path.dirname(out), 'manifest.webmanifest'), JSON.stringify({
  name: 'Trunk.', short_name: 'Trunk.', lang: 'ja', start_url: './', scope: './', display: 'standalone',
  background_color: '#15202B', theme_color: '#F3F4F1',
  icons: [{ src: '/icons/trunk-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icons/trunk-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
}, null, 2));
console.log('built', out, html.length);
