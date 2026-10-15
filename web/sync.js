// アーティファクト版（非公開リポジトリ）から、共通のコードを shared/ に写す。
// 使い方: node sync.js  （このMacの ~/Documents/travel-manager/artifact から読む）
// 個人情報（メールアドレスなど）が入っていたら止める。
const fs = require('fs'), path = require('path');
const from = path.resolve(__dirname, '../../travel-manager/artifact');
const files = ['model.js', 'phrase-data.js', 'world-data.js', 'map.jsx', 'app.jsx', 'extras.jsx', 'phrases.jsx', 'shiori.jsx', 'share.jsx', 'consult.jsx', 'style.css'];
const bad = /genereoyuna|@gmail\.com|姉宅/;
for (const f of files) {
  const s = fs.readFileSync(path.join(from, f), 'utf8');
  if (bad.test(s)) { console.error(`個人情報らしい文字列が ${f} にあります。中止します`); process.exit(1); }
  fs.writeFileSync(path.join(__dirname, 'shared', f), s);
}
console.log('synced', files.length, 'files from', from);
