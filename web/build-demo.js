// 見本の画面を作る（preview/demo は手元の確認用、/demo/ はサイトに出す「ログインせずに見てみる」）
const Babel = require('@babel/standalone');
const fs = require('fs'), path = require('path');
const S = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const trunk = S('src/trunk.jsx').replace('ReactDOM.createRoot(document.getElementById("root")).render(<Root />);', '');
const src = [S('src/trunk-config.js'), S('src/places.js'), ...['shared/model.js', 'shared/phrase-data.js', 'shared/world-data.js', 'shared/map.jsx', 'src/store.js', 'shared/app.jsx', 'shared/extras.jsx', 'shared/phrases.jsx', 'shared/shiori.jsx', 'shared/consult.jsx'].map(S), trunk, S('src/demo-root.jsx')].join('\n');
const code = Babel.transform(src, { presets: ['react'] }).code.replace(/<\/script/gi, '<\\/script');
const app = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
const html = app.slice(0, app.lastIndexOf('<script>')) + '<script>\n' + code + '\n</script>\n</body>\n</html>\n';
// 手元の確認用（preview/demo）と、サイトに出す見本（/demo/。ログインせずに触れる）の2つを作る
const trip = path.resolve(__dirname, '../marketing/threads/demo-seoul.json');
const pub = html
  .replace(/<title>[^<]*<\/title>/, '<title>見本の旅行（ソウル3泊4日） | Trunk.</title>\n<meta name="robots" content="noindex">')
  .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="ログインせずに Trunk. を試せる見本の旅行です。">');
for (const [dir, page] of [['../preview/demo', html], ['../demo', pub]]) {
  const d = path.resolve(__dirname, dir);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'index.html'), page);
  fs.copyFileSync(trip, path.join(d, 'trip.json'));
  console.log('built', path.join(d, 'index.html'));
}
