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
  // 予約メールの取り込み（?mail=1 で使える状態と見本のメールを出す）
  const MAILDEMO = new URLSearchParams(location.search).get("mail") === "1";
  FEATURES.mailImport = true;
  Store.canMailImport = async () => MAILDEMO;
  Store.myInboundAddress = async () => "k7x2m9ab3d@in.trunk-travelplanner.com";
  Store.setInboundStatus = async () => {};
  Store.listInbound = async () => MAILDEMO ? [
    { id: "m1", kind: "gmail_confirm", status: "parsed", subject: "Gmail の転送の確認", from_addr: "forwarding-noreply@google.com", received_at: new Date().toISOString(), parsed: { code: "", link: "https://mail.google.com/mail/vf-example" } },
    { id: "m2", kind: "booking", status: "parsed", subject: "【予約確定】弘大のゲストハウス", from_addr: "no-reply@example-hotel.com", received_at: new Date().toISOString(),
      parsed: { is_booking: true, kind: "hotel", booking_status: "confirmed", summary: "ソウル 明洞のホテル 12/5〜12/6 予約確定", provider: "Agoda", name: "明洞セントラルホテル", city: "ソウル", address: "ソウル特別市 中区 明洞", checkin_date: "2026-12-05", checkout_date: "2026-12-06", checkin_time: "15:00", checkout_time: "11:00", guests: 3, total_amount: 24000, currency: "JPY", cancel_policy: "free_cancel", cancel_deadline: "2026-12-03", paid: "unpaid", confirmation: "AGD123456", manage_url: "", transport_mode: "", from_place: "", to_place: "", depart_date: "", depart_time: "", arrive_date: "", arrive_time: "", carrier: "", seat_class: "", activity_date: "", activity_time: "" } },
    { id: "m3", kind: "booking", status: "parsed", subject: "Your booking is confirmed", from_addr: "you@example.com", received_at: new Date().toISOString(),
      parsed: { is_booking: true, kind: "hotel", booking_status: "confirmed", summary: "台北 西門のホテル 2027/1/10〜1/12 予約確定", provider: "Booking.com", name: "西門シティホテル", city: "台北", address: "台北市 萬華區", checkin_date: "2027-01-10", checkout_date: "2027-01-12", checkin_time: "15:00", checkout_time: "11:00", guests: 2, total_amount: 6400, currency: "TWD", cancel_policy: "free_cancel", cancel_deadline: "2027-01-08", paid: "unpaid", confirmation: "BK7788", manage_url: "", transport_mode: "", from_place: "", to_place: "", depart_date: "", depart_time: "", arrive_date: "", arrive_time: "", carrier: "", seat_class: "", activity_date: "", activity_time: "" } },
  ] : [];
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
