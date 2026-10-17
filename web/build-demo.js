// 紹介用の画面を作る（手元の確認用。../preview/demo/index.html。preview はサイトに出さない）
const Babel = require('@babel/standalone');
const fs = require('fs'), path = require('path');
const S = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const trunk = S('src/trunk.jsx').replace('ReactDOM.createRoot(document.getElementById("root")).render(<Root />);', '');
const src = [S('src/trunk-config.js'), S('src/places.js'), ...['shared/model.js', 'shared/phrase-data.js', 'shared/world-data.js', 'shared/map.jsx', 'src/store.js', 'shared/app.jsx', 'shared/extras.jsx', 'shared/phrases.jsx', 'shared/shiori.jsx', 'shared/consult.jsx'].map(S), trunk, S('src/demo-root.jsx')].join('\n');
const code = Babel.transform(src, { presets: ['react'] }).code.replace(/<\/script/gi, '<\\/script');
const app = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
const html = app.slice(0, app.lastIndexOf('<script>')) + '<script>\n' + code + '\n</script>\n</body>\n</html>\n';
const out = path.resolve(__dirname, '../preview/demo/index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('built', out);
