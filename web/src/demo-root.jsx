// ================= 紹介用の画面（手元だけ。サイトには出さない） =================
// 架空の旅行（marketing/threads/demo-seoul.json）で、ログインなしにアプリを表示する。
// ?view=list|day&book=all&sheet=shiori&day=2026-12-05&scroll=400 と #home|#plan|#book で最初の画面を決める
const DQ = new URLSearchParams(location.search);
window.__demo = { view: DQ.get("view"), book: DQ.get("book"), sheet: DQ.get("sheet"), day: DQ.get("day") };
(async () => {
  const d = await (await fetch("/marketing/threads/demo-seoul.json")).json();
  Store.session = { user: { id: "demo" } };
  Store.watchTrips = (cb) => { Store.cache = new Map([["demo", d]]); Store.meta = new Map([["demo", { version: 1, pass: false, joined: false }]]); cb([{ id: "demo", data: d, pass: false, joined: false }]); return () => {}; };
  Store.saveTrip = async (id, data) => data;
  Store.loadPrivate = async () => ({}); Store.savePrivate = async () => {};
  Store.loadPasses = async () => {}; Store.people = async () => []; Store.share = async () => null;
  Store.requests = async () => []; Store.newRequestCount = async () => 0;
  rememberTrip("demo");
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  // ?to=セレクター で、その要素が画面の上に来るまでスクロールする（off で少し手前に）
  // ?zoom=3：ヘッドレスの Chrome は幅を 500px より狭くできないので、拡大して 390px 幅のスマホと同じ並びにする
  if (DQ.get("zoom")) document.documentElement.style.zoom = DQ.get("zoom");
  // ?click=ボタンの文字：最初に1回押す（「リスト」など）
  setTimeout(() => { const c = DQ.get("click"); if (c) { const b = [...document.querySelectorAll("button")].find(x => x.innerText.trim() === c); if (b) b.click(); } }, 900);
  setTimeout(() => {
    const to = DQ.get("to"), off = Number(DQ.get("off") || 0), y = Number(DQ.get("scroll") || 0);
    if (to) { const el = document.querySelector(to); if (el) { el.scrollIntoView({ block: "start" }); const sc = el.closest(".body") || document.scrollingElement; sc.scrollTop -= off; } }
    else if (y) window.scrollTo(0, y);
  }, 1500);
})();
