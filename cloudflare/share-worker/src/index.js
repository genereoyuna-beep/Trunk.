// 共有リンクのプレビュー用。人が開いたら、すぐに共有ページ（trunk-travelplanner.com/s/?k=…）へ移る。
// LINE・X などの読み取りには、旅行名・日程・都市の入った題名と画像（/og/トークン.png）を返す。
// 旅程の中身は get_share（共有ページと同じ、緊急時の情報・支出・予約番号を外したもの）から読む。
import { ImageResponse, loadGoogleFont } from "workers-og";
import { EmailMessage } from "cloudflare:email";

const TOKEN = /^[A-Za-z0-9_-]{6,80}$/;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const WD = ["日", "月", "火", "水", "木", "金", "土"];
const md = (iso) => { const d = new Date(iso + "T00:00:00Z"); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}（${WD[d.getUTCDay()]}）`; };
const cityMain = (c) => String(c || "").split(/[（(]/)[0].split("・")[0].trim();

async function getShare(env, token) {
  // 手元での確認用（wrangler dev --var DEMO_SHARE:…）。本番では設定しない
  if (env.DEMO_SHARE) return { data: JSON.parse(env.DEMO_SHARE), updatedAt: "demo" };
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/get_share`, {
    method: "POST", headers: { apikey: env.SUPABASE_KEY, "content-type": "application/json" }, body: JSON.stringify({ p_token: token }),
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j && j.data ? j : null;
}

// 旅行名・期間・都市（共有ページと同じ考え方で、宿と移動の日付から期間を出す）
function summary(data) {
  const it = Array.isArray(data.itinerary) ? data.itinerary : [];
  const stays = it.filter(x => x.type === "stay" && isISO(x.startDate)).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const dates = [];
  stays.forEach(s => { dates.push(s.startDate, addDays(s.startDate, Math.max(0, Number(s.nights) || 0))); });
  it.filter(x => x.type === "transit").forEach(x => { if (isISO(x.departDate)) dates.push(x.departDate); if (isISO(x.arriveDate)) dates.push(x.arriveDate); });
  dates.sort();
  const start = dates[0], end = dates[dates.length - 1];
  const days = start ? Math.round((Date.parse(end) - Date.parse(start)) / 864e5) + 1 : 0;
  const cities = [...new Set(stays.map(s => cityMain(s.city)).filter(Boolean))];
  return { name: String(data.name || "旅行").slice(0, 40), start, end, days, cities };
}

function page(env, token, s, version) {
  const target = `${env.SITE}/s/?k=${encodeURIComponent(token)}`;
  const title = s ? `${s.name}の旅程` : "旅程を共有しています";
  const desc = s && s.start ? `${md(s.start)}〜${md(s.end)}・${s.days}日間${s.cities.length ? "・" + s.cities.slice(0, 5).join("・") : ""}。Trunk. で作った旅程です。` : "Trunk. で作った旅程です。";
  const img = `https://s.trunk-travelplanner.com/og/${encodeURIComponent(token)}.png?v=${encodeURIComponent(version || "")}`;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Trunk.</title><meta name="robots" content="noindex">
<meta property="og:type" content="website"><meta property="og:site_name" content="Trunk.">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(target)}"><meta property="og:image" content="${esc(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="description" content="${esc(desc)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}"><script>location.replace(${JSON.stringify(target)})</script>
</head><body style="font-family:sans-serif;padding:24px"><a href="${esc(target)}">旅程を開く</a></body></html>`;
}

async function image(s) {
  const dates = s.start ? `${s.start.replace(/-/g, ".")} — ${s.end.slice(5).replace("-", ".")}　${s.days}日間` : "";
  const cities = s.cities.slice(0, 6);
  const chips = cities.map(c => `<div style="display:flex;padding:10px 26px;border-radius:999px;background:#E3ECFD;color:#1D4ED8;font-size:30px;margin-right:14px">${esc(c)}</div>`).join("");
  const html = `<div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#F3F4F1;padding:64px 72px;font-family:'Noto Sans JP'">
  <div style="display:flex;width:1056px;align-items:center;justify-content:space-between">
    <div style="display:flex;font-size:40px;font-weight:700;color:#15202B">Trunk<span style="color:#1D4ED8">.</span></div>
    <div style="display:flex;font-size:24px;color:#5A6470;border:2px solid #C9CFD6;border-radius:999px;padding:6px 22px">旅程を共有しています</div>
  </div>
  <div style="display:flex;flex-direction:column;margin-top:70px">
    <div style="display:flex;font-size:76px;font-weight:700;color:#15202B;line-height:1.2">${esc(s.name)}</div>
    <div style="display:flex;font-size:36px;color:#3D4650;margin-top:22px">${esc(dates)}</div>
  </div>
  <div style="display:flex;margin-top:36px">${chips}</div>
  <div style="display:flex;width:1056px;margin-top:auto;justify-content:space-between;font-size:24px;color:#5A6470"><span>trunk-travelplanner.com</span><span>旅行計画アプリ Trunk.</span></div>
</div>`;
  // タグの間の改行が要素として並ばないように詰める
  const tight = html.replace(/>\s+</g, "><");
  const text = `Trunk.旅程を共有していますtrunk-travelplanner.com旅行計画アプリ${s.name}${dates}${cities.join("")}`;
  const [bold, regular] = await Promise.all([
    loadGoogleFont({ family: "Noto Sans JP", weight: 700, text }),
    loadGoogleFont({ family: "Noto Sans JP", weight: 400, text }),
  ]);
  return new ImageResponse(tight, { width: 1200, height: 630, fonts: [
    { name: "Noto Sans JP", data: regular, weight: 400, style: "normal" },
    { name: "Noto Sans JP", data: bold, weight: 700, style: "normal" },
  ] });
}

// 日本語の件名・本文を、そのまま送れる形（UTF-8）のメールにする
const b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
function rawMail(from, to, subject, text) {
  const body = b64(text).replace(/.{1,76}/g, "$&\r\n");
  return [`From: Trunk. <${from}>`, `To: ${to}`, `Subject: =?UTF-8?B?${b64(subject)}?=`, `Message-ID: <${crypto.randomUUID()}@trunk-travelplanner.com>`, `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", body].join("\r\n");
}
async function notifyFeedback(req, env) {
  if (!env.NOTIFY_SECRET || !env.NOTIFY_TO || req.headers.get("x-notify-secret") !== env.NOTIFY_SECRET) return new Response("forbidden", { status: 403 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.NOTIFY_TO)) return new Response("send failed: NOTIFY_TO is not an email address", { status: 500 });
  const j = await req.json().catch(() => ({}));
  const r = j.record || j;
  const when = new Date(r.created_at || Date.now()).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const text = `Trunk. に要望が届きました。\n\n${String(r.body || "").slice(0, 4000)}\n\n----\n送られた場所：${r.where_from || "（不明）"}\n日時：${when}\n\n一覧は Supabase の feedback の表で見られます。`;
  // 送り主は Email Routing が有効なドメイン（in.trunk-travelplanner.com）のアドレスにする
  const from = "notify@in.trunk-travelplanner.com";
  try {
    await env.MAILER.send(new EmailMessage(from, env.NOTIFY_TO, rawMail(from, env.NOTIFY_TO, "Trunk. に要望が届きました", text)));
  } catch (e) {
    // 失敗の理由をデータベースの記録（net._http_response）で見られるように返す。アドレスは含めない
    // 理由は種類だけ返す（エラー文には設定した値がそのまま入ることがあるので、そのままは返さない）
    const m = String((e && e.message) || e);
    const why = /mail from/i.test(m) ? "sender" : /rcpt to|destination|not verified/i.test(m) ? "destination" : "other";
    return new Response("send failed: " + why, { status: 500 });
  }
  return new Response("ok");
}

// 新しい人が登録したら知らせる（名前やメールアドレスは送らない。人数と日時だけ）
async function notifySignup(req, env) {
  if (!env.NOTIFY_SECRET || !env.NOTIFY_TO || req.headers.get("x-notify-secret") !== env.NOTIFY_SECRET) return new Response("forbidden", { status: 403 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.NOTIFY_TO)) return new Response("send failed: NOTIFY_TO is not an email address", { status: 500 });
  const j = await req.json().catch(() => ({}));
  const total = Number(j.total) || 0;
  const when = new Date(j.created_at || Date.now()).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const text = `Trunk. に新しく1人が登録しました。\n\n登録した人の合計：${total}人\n日時：${when}\n\nくわしくは Google アナリティクスや Supabase で見られます。`;
  const from = "notify@in.trunk-travelplanner.com";
  try { await env.MAILER.send(new EmailMessage(from, env.NOTIFY_TO, rawMail(from, env.NOTIFY_TO, `Trunk. に新しいユーザー（合計${total}人）`, text))); }
  catch (e) { return new Response("send failed: " + (/mail from/i.test(String(e && e.message)) ? "sender" : "other"), { status: 500 }); }
  return new Response("ok");
}

// 毎朝の数字（前の日の分）。数だけで、名前やメールアドレスは入っていない
async function notifyDaily(req, env) {
  if (!env.NOTIFY_SECRET || !env.NOTIFY_TO || req.headers.get("x-notify-secret") !== env.NOTIFY_SECRET) return new Response("forbidden", { status: 403 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.NOTIFY_TO)) return new Response("send failed: NOTIFY_TO is not an email address", { status: 500 });
  const j = await req.json().catch(() => ({}));
  const n = (k) => Number(j[k]) || 0;
  const day = String(j.day || "").replace(/^\d{4}-0?(\d+)-0?(\d+)$/, "$1/$2");
  const pct = (a, b) => b ? `（${Math.round(a / b * 100)}%）` : "";
  const text = [
    `${day} の Trunk.`,
    "",
    "■ 人",
    `新しく登録：${n("users_new")}人（合計 ${n("users_total")}人）`,
    `旅行を編集した人：${n("editors")}人`,
    `  うち前の日までに登録していた人（戻ってきた人）：${n("returning")}人`,
    `登録したけれど旅行がない人：${n("no_trip")}人`,
    "",
    "■ 旅行",
    `新しく作られた旅行：${n("trips_new")}件（合計 ${n("trips_total")}件）`,
    `予定が入っている旅行：${n("with_plans")}件${pct(n("with_plans"), n("trips_total"))}`,
    `宿の名前が入っている旅行：${n("with_hotel")}件${pct(n("with_hotel"), n("trips_total"))}`,
    `支出が入っている旅行：${n("with_expense")}件${pct(n("with_expense"), n("trips_total"))}`,
    "",
    "■ 前の日にあったこと",
    `共有リンクを作った：${n("shares_new")}件`,
    `招待リンクを作った：${n("invites_new")}件`,
    `要望：${n("feedback_new")}件`,
    `パスの購入：${n("passes_new")}件`,
    `予約メールの取り込み：${n("mail_new")}通`,
    "",
    "数には、本人とテスト用のアカウントも入っています。",
  ].join("\n");
  const from = "notify@in.trunk-travelplanner.com";
  try { await env.MAILER.send(new EmailMessage(from, env.NOTIFY_TO, rawMail(from, env.NOTIFY_TO, `Trunk. ${day} の数字（新規${n("users_new")}・編集${n("editors")}）`, text))); }
  catch (e) { return new Response("send failed: " + (/mail from/i.test(String(e && e.message)) ? "sender" : "other"), { status: 500 }); }
  return new Response("ok");
}

// ===== 天気（アプリの日ごとの画面の「☀️ 18°/9°」と服装の目安） =====
// 予報：MET Norway（お金を取るサービスでも無料。出所を書く・アプリ名を名乗る・結果を保存して取りすぎない、が決まり）。約9日先まで
// それより先：NASA POWER の平年値（月ごとの平均の最高・最低気温と雨の量。公開データ）
// どちらも場所を 0.1 度（約10km）に丸めて、Cloudflare に保存して使い回す
const WX_ORIGINS = /^(https:\/\/trunk-travelplanner\.com|http:\/\/localhost(:\d+)?|http:\/\/127\.0\.0\.1(:\d+)?)$/;
const WX_UA = "Trunk. travel planner https://trunk-travelplanner.com/";
function wxHeaders(req, maxAge) {
  const o = req.headers.get("origin") || "";
  return { "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${maxAge}`, ...(WX_ORIGINS.test(o) ? { "access-control-allow-origin": o, vary: "origin" } : {}) };
}
async function cachedJSON(ctx, key, maxAge, make) {
  const cache = caches.default, ck = new Request(key);
  const hit = await cache.match(ck);
  if (hit) return hit.json();
  const body = await make();
  if (body) ctx.waitUntil(cache.put(ck, new Response(JSON.stringify(body), { headers: { "cache-control": `public, max-age=${maxAge}` } })));
  return body;
}
// 予報を、その土地の日付ごとにまとめる（最高・最低気温、雨の量、昼ごろの天気）
async function weatherForecast(req, ctx, lat, lon, tz) {
  const body = await cachedJSON(ctx, `https://wx.cache/v2/f/${lat}/${lon}/${tz}`, 3600, async () => {
    const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, { headers: { "user-agent": WX_UA } });
    if (!r.ok) return null;
    const j = await r.json();
    const days = {};
    for (const p of (j.properties && j.properties.timeseries) || []) {
      const local = new Date(Date.parse(p.time) + tz * 3600e3);
      const date = local.toISOString().slice(0, 10), hour = local.getUTCHours();
      const t = p.data && p.data.instant && p.data.instant.details && p.data.instant.details.air_temperature;
      const d = days[date] || (days[date] = { date, max: -99, min: 99, rain: 0, symbol: "", sh: 99 });
      if (typeof t === "number") { d.max = Math.max(d.max, t); d.min = Math.min(d.min, t); }
      const n1 = p.data.next_1_hours, n6 = p.data.next_6_hours;
      if (n1 && n1.details) d.rain += n1.details.precipitation_amount || 0;
      else if (n6 && n6.details && hour % 6 === 0) d.rain += n6.details.precipitation_amount || 0;
      const sym = (n1 && n1.summary && n1.summary.symbol_code) || (n6 && n6.summary && n6.summary.symbol_code) || "";
      if (sym && Math.abs(hour - 13) < d.sh) { d.symbol = sym; d.sh = Math.abs(hour - 13); }
    }
    return { source: "MET Norway", days: Object.values(days).filter(d => d.max > -99).map(({ sh, ...d }) => ({ ...d, max: Math.round(d.max), min: Math.round(d.min), rain: Math.round(d.rain * 10) / 10 })) };
  });
  return new Response(JSON.stringify(body || { days: [] }), { status: body ? 200 : 502, headers: wxHeaders(req, 1800) });
}
// 気象庁の週間天気予報（日本国内）。地方ごとのコード（例：大阪 270000）で取る。信頼度 A・B・C と降水確率つき
async function weatherJma(req, ctx, office) {
  const body = await cachedJSON(ctx, `https://wx.cache/v2/j/${office}`, 3600, async () => {
    const r = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${office}.json`, { headers: { "user-agent": WX_UA } });
    if (!r.ok) return null;
    const j = await r.json(), wk = j[1] && j[1].timeSeries;
    if (!wk || !wk[0] || !wk[1]) return null;
    const a = wk[0].areas[0] || {}, b = wk[1].areas[0] || {};
    // 気温の欄が空の日（今日など）は気温なしになるので外す（その日はノルウェー気象局の予報を使う）
    const num = (v) => v === "" || v == null ? null : Number(v);
    const days = wk[0].timeDefines.map((t, i) => ({ date: String(t).slice(0, 10), code: (a.weatherCodes || [])[i] || "", pop: num((a.pops || [])[i]), rel: (a.reliabilities || [])[i] || "", max: num((b.tempsMax || [])[i]), min: num((b.tempsMin || [])[i]) }))
      .filter(d => d.code && d.max != null && d.min != null);
    return { source: "気象庁", area: (a.area && a.area.name) || "", days };
  });
  return new Response(JSON.stringify(body || { days: [] }), { status: body ? 200 : 502, headers: wxHeaders(req, 1800) });
}
// 平年値（1月〜12月）
async function weatherClimate(req, ctx, lat, lon) {
  const body = await cachedJSON(ctx, `https://wx.cache/v2/c/${lat}/${lon}`, 2592000, async () => {
    const r = await fetch(`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,T2M_RANGE,PRECTOTCORR&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`, { headers: { "user-agent": WX_UA } });
    if (!r.ok) return null;
    const j = await r.json(), p = (j.properties && j.properties.parameter) || {};
    const M = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    // 平均気温と、1日の寒暖差の平均から、ふつうの日の最高・最低を出す（T2M_MAX・T2M_MIN は月の極端な値なので使わない）
    const months = M.map((m, i) => { const t = (p.T2M || {})[m], rg = (p.T2M_RANGE || {})[m]; return { month: i + 1, max: Math.round(t + rg / 2), min: Math.round(t - rg / 2), rain: Math.round(((p.PRECTOTCORR || {})[m] || 0) * 10) / 10 }; });
    return months.every(m => Number.isFinite(m.max)) ? { source: "NASA POWER", months } : null;
  });
  return new Response(JSON.stringify(body || { months: [] }), { status: body ? 200 : 502, headers: wxHeaders(req, 86400) });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === "/jma") {
      const office = String(url.searchParams.get("office") || "");
      if (!/^\d{6}$/.test(office)) return new Response("bad office", { status: 400 });
      return weatherJma(req, ctx, office);
    }
    if (url.pathname === "/weather" || url.pathname === "/climate") {
      const lat = Math.round(Number(url.searchParams.get("lat")) * 10) / 10, lon = Math.round(Number(url.searchParams.get("lon")) * 10) / 10;
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return new Response("bad place", { status: 400 });
      if (url.pathname === "/climate") return weatherClimate(req, ctx, lat, lon);
      const tz = Math.max(-12, Math.min(14, Math.round(Number(url.searchParams.get("tz")) || 0)));
      return weatherForecast(req, ctx, lat, lon, tz);
    }
    if (url.pathname === "/notify/daily" && req.method === "POST") return notifyDaily(req, env);
    if (url.pathname === "/notify/feedback" && req.method === "POST") return notifyFeedback(req, env);
    if (url.pathname === "/notify/signup" && req.method === "POST") return notifySignup(req, env);
    // 予約メールの転送先を、スマホの連絡先に入れるためのファイル（/vcf/トークン.vcf）。iPhone はアプリの中で作ったファイルを連絡先に渡せないので、ここから配る
    const vc = url.pathname.match(/^\/vcf\/([a-z0-9]{10})\.vcf$/);
    if (vc) {
      const card = ["BEGIN:VCARD", "VERSION:3.0", "N:;Trunk 予約メール;;;", "FN:Trunk 予約メール", `EMAIL;TYPE=INTERNET:${vc[1]}@in.trunk-travelplanner.com`, "END:VCARD", ""].join("\r\n");
      return new Response(card, { headers: { "content-type": "text/vcard; charset=utf-8", "content-disposition": 'inline; filename="trunk-mail.vcf"', "cache-control": "no-store", "x-robots-tag": "noindex" } });
    }
    const og = url.pathname.match(/^\/og\/([^/]+)\.png$/);
    const token = og ? decodeURIComponent(og[1]) : (url.searchParams.get("k") || url.pathname.slice(1));
    if (!TOKEN.test(token || "")) return Response.redirect(env.SITE + "/", 302);
    if (og) {
      const cache = caches.default, key = new Request(url.toString());
      const hit = await cache.match(key); if (hit) return hit;
      const sh = await getShare(env, token);
      if (!sh) return Response.redirect(env.SITE + "/og.png", 302);
      const res = await image(summary(sh.data));
      const out = new Response(res.body, { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400", "x-robots-tag": "noindex" } });
      ctx.waitUntil(cache.put(key, out.clone()));
      return out;
    }
    const sh = await getShare(env, token);
    return new Response(page(env, token, sh ? summary(sh.data) : null, sh && sh.updatedAt), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
  },
};
