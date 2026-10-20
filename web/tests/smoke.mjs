// 動作確認（デモの旅行で主な画面を順に開き、エラーと大事な表示を確かめる）
// 使い方：cd web && npm run build && node build-demo.js && npm run test:smoke
// 自分で小さなファイルサーバーを立てるので、開発サーバーは要らない
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";

const ROOT = new URL("../../", import.meta.url).pathname;
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json", ".css": "text/css" };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  try { const b = await readFile(join(ROOT, p)); res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404); res.end("not found"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--remote-debugging-port=9339", "--user-data-dir=" + await mkdtemp(join(tmpdir(), "smoke")), "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let list; for (let i = 0; i < 50 && !list; i++) { await sleep(200); try { list = await (await fetch("http://127.0.0.1:9339/json/list")).json(); } catch {} }
const ws = new WebSocket(list.find(t => t.type === "page").webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; const errors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend[d.id]) { pend[d.id](d.result || d); delete pend[d.id]; }
  if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map(a => a.value || a.description).join(" "));
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => { const r = await send("Runtime.evaluate", { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval error"); return r.result?.value; };
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

const results = [];
const check = async (name, fn) => { try { const msg = await fn(); results.push(["✅", name, msg || ""]); } catch (e) { results.push(["❌", name, String(e.message || e).slice(0, 200)]); } };
const open = async (q = "", hash = "#home") => { await send("Page.navigate", { url: `${BASE}/preview/demo/${q}${hash}` }); await sleep(2500); };
const H = `const w=ms=>new Promise(r=>setTimeout(r,ms)); const btn=t=>[...document.querySelectorAll('button')].find(b=>b.innerText.trim()===t); const main=()=>document.querySelector('main').innerText;`;

await check("ホーム：出発までの日数と今やること", async () => { await open(); const t = await js(`${H} return main();`); if (!/出発まで/.test(t) || !/今やること/.test(t)) throw new Error("見出しがない"); });
await check("ホーム：未手配の宿にアゴダのリンク", async () => { const n = await js(`return [...document.querySelectorAll('a')].filter(a=>/アゴダで.+の宿を探す/.test(a.innerText)).length;`); if (!n) throw new Error("リンクがない"); });
await check("予約・手配：同じ日は時刻順", async () => {
  await open("?book=all", "#book");
  const ok = await js(`${H} const rows=main().split('\\n').filter(x=>/^\\d+\\/\\d+ \\d\\d:\\d\\d/.test(x)).map(x=>x.slice(0,11)); for(let i=1;i<rows.length;i++){ const [d1,t1]=rows[i-1].split(' '), [d2,t2]=rows[i].split(' '); if(d1===d2 && t1>t2) return rows[i-1]+' > '+rows[i]; } return 'ok';`);
  if (ok !== "ok") throw new Error("並び順：" + ok);
});
await check("お金：予算・支出・精算が開く", async () => {
  await open("", "#money");
  const r = await js(`${H} btn('お金').click(); await w(600); const a=main(); btn('支出').click(); await w(800); const b=main(); btn('精算').click(); await w(500); const c=main(); return [/予算（1人分/.test(a), /支出を記録/.test(b), /参加者/.test(c) && /精算/.test(c) && !/人ごとの負担/.test(c)].join(',');`);
  if (r !== "true,true,true") throw new Error(r);
});
await check("お金：外貨レートが自動で入る", async () => { const r = await js(`${H} btn('支出').click(); await w(2500); return /1 KRW = /.test(main());`); if (!r) throw new Error("レートが入らない（通信できない環境では失敗します）"); });
await check("旅程：日ごとの地図が出る", async () => { await open("?view=day&day=2026-12-05", "#plan"); const n = await js(`${H} await w(1500); return document.querySelectorAll('svg[aria-label$="の地図"] circle').length;`); if (!(n >= 5)) throw new Error("地図の点：" + n); });
await check("持ち物：海外の通信（eSIM）", async () => { await open("", "#pack"); const r = await js(`${H} btn('持ち物').click(); await w(600); return /AiraloでeSIMを探す/.test(main());`); if (!r) throw new Error("出ない"); });
await check("メニュー：緊急時の情報に韓国の番号", async () => {
  const r = await js(`${H} [...document.querySelectorAll('button')].find(b=>/メニュー|…|more/i.test((b.getAttribute('aria-label')||'')+b.innerText)).click(); await w(500); [...document.querySelectorAll('button')].find(b=>b.innerText.startsWith('緊急時の情報')).click(); await w(800); return (document.querySelector('[role=dialog], .sheet')||document.body).innerText;`);
  if (!/警察 112/.test(r)) throw new Error("番号が出ない");
});
await check("しおり：PDF用のページが作れる（地図の背景つき）", async () => {
  await open("?sheet=shiori", "#home");
  const r = await js(`${H} const b=btn('日ごとの地図'); b&&b.click(); await w(2500);
    await new Promise((ok,ng)=>{ if(window.html2canvas) return ok(); const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload=ok; s.onerror=ng; document.head.appendChild(s); });
    const pages=[...document.querySelector('.sh-export').children]; const p=pages.find(x=>x.querySelector('.sh-daymap'));
    const c=await html2canvas(p,{scale:1,backgroundColor:'#fff',logging:false}); return pages.length+' pages, map image: '+!!p.querySelector('.sh-daymap image');`);
  return r;
});
await check("新しい旅行：人数と名前の欄", async () => {
  const r = await js(`${H} const d=document.createElement('div'); document.body.appendChild(d); ReactDOM.createRoot(d).render(React.createElement(TripsSheet,{trips:[],currentId:null,onPick:()=>{},onCreate:async()=>{},onSettings:null})); await w(300); [...d.querySelectorAll('button')].find(b=>b.innerText.trim()==='新しい旅行').click(); await w(300); const sel=[...d.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.text==='3人')); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(sel,'3'); sel.dispatchEvent(new Event('change',{bubbles:true})); await w(300); const n=[...d.querySelectorAll('input')].filter(i=>/自分|同行者/.test(i.placeholder)).length; d.remove(); return n;`);
  if (r !== 3) throw new Error("名前の欄：" + r);
});
await check("共有：右上のボタンで共有の画面が開く", async () => {
  await open();
  const t = await js(`${H} document.querySelector('[aria-label="この旅行を共有する"]').click(); await w(700); const d=document.querySelector('[role=dialog]'); return d ? d.innerText : '';`);
  if (!/^共有/.test(t) || !/共有リンク/.test(t) || !/招待リンク/.test(t)) throw new Error(t.slice(0, 80));
});
await check("予約メール：転送先・承認・日程外の予約・外貨の円換算", async () => {
  await open("?mail=1", "#book");
  const t = await js(`${H} await w(800); const a=document.querySelector('[aria-label="転送用のアドレス"]'); return (a ? a.value : '') + '\\n' + main();`);
  const need = [/@in\.trunk-travelplanner\.com/, /連絡先に追加/, /Gmail で承認する/, /どの旅行の日程にも入っていません/, /新しい旅行として作る/, /円で計算/];
  const miss = need.filter(r => !r.test(t)); if (miss.length) throw new Error("見つからない：" + miss.join(" "));
});
await check("支出：予約を入れて精算、誰の分を直すと金額が変わる", async () => {
  await open("", "#money");
  const r = await js(`${H} btn('支出').click(); await w(500); btn('入れる').click(); await w(500);
    btn('精算').click(); await w(500); const before=main();
    btn('支出').click(); await w(500); [...document.querySelectorAll('button[aria-expanded]')].find(b=>/明洞のホテル/.test(b.innerText)).click(); await w(400);
    const c=[...document.querySelectorAll('button.chip')].filter(b=>b.innerText.trim()==='みさき'); c[c.length-1].click(); await w(400);
    btn('精算').click(); await w(500); return [/みさき → あおい\\n¥12,000/.test(before), /けんた → あおい\\n¥18,000/.test(main())].join(',');`);
  if (r !== "true,true") throw new Error(r);
});
await check("精算：参加者の名前を直すと支出にも反映", async () => {
  const r = await js(`${H} const setV=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}));};
    document.querySelector('[aria-label="けんたの名前を直す"]').click(); await w(300); setV(document.querySelector('[aria-label="けんたの新しい名前"]'),'ケンタ'); await w(100);
    document.querySelector('[aria-label="名前を変える"]').click(); await w(500);
    let msg=''; window.confirm=(m)=>{msg=m; return false;}; document.querySelector('[aria-label="あおいを外す"]').click(); await w(200);
    return [/ケンタ → あおい/.test(main()), /払った支出が1件/.test(msg)].join(',');`);
  if (r !== "true,true") throw new Error(r);
});
await check("予算：支出を食費に入れると実費に出る", async () => {
  await open("", "#money");
  const r = await js(`${H} const setV=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}));};
    btn('支出').click(); await w(500); const sec=[...document.querySelectorAll('section')].find(s=>s.innerText.startsWith('支出を記録'));
    const ins=sec.querySelectorAll('input'); setV(ins[0],'ランチ'); setV(ins[1],'3000'); const sel=sec.querySelector('select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(sel,'JPY'); sel.dispatchEvent(new Event('change',{bubbles:true})); await w(200);
    btn('記録する').click(); await w(400); btn('予算').click(); await w(400);
    const row=[...document.querySelectorAll('.brow2')].find(r=>r.querySelector('input') && r.querySelector('input').value==='食費'); return row ? row.innerText : 'no row';`);
  if (!/支出から（1件）/.test(r) || !/¥1,000/.test(r)) throw new Error(r.replace(/\n/g, " ").slice(0, 120));
});
await check("LP・ガイド・記事が開く", async () => {
  for (const p of ["/", "/guide.html", "/articles/shiori.html", "/articles/seoul-3n4d.html", "/privacy.html"]) { const res = await fetch(BASE + p); if (!res.ok) throw new Error(p + " " + res.status); const t = await res.text(); if (/広告なし</.test(t)) throw new Error(p + "：「広告なし」が残っている"); }
});
await check("ブラウザのエラーなし", async () => { const e = errors.filter(x => !/favicon|Failed to load resource/.test(x)); if (e.length) throw new Error(e.slice(0, 3).join(" | ")); });

ws.close(); chrome.kill(); server.close();
for (const [s, n, m] of results) console.log(`${s} ${n}${m ? "  — " + m : ""}`);
const failed = results.filter(r => r[0] === "❌").length;
console.log(failed ? `\n${failed} 件うまくいきませんでした` : "\nすべて通りました");
process.exit(failed ? 1 : 0);
