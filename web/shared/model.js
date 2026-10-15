// ================= 日付・表示の小道具 =================
const pad = (n) => String(n).padStart(2, "0");
const WD = "日月火水木金土";
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const dayNum = (iso) => Math.round(Date.parse(iso + "T00:00:00Z") / 864e5);
const dayDiff = (a, b) => dayNum(b) - dayNum(a);
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const wdOf = (iso) => (iso ? WD[new Date(iso + "T00:00:00Z").getUTCDay()] : "");
const md = (iso) => (iso ? `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}` : "");
const yen = (n) => "¥" + Math.round(Number(n) || 0).toLocaleString("ja-JP");
const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
function uid() { return Date.now() + Math.random(); }
// 「ストックホルム（友人宅・ミッドサマー）」→ 都市名と補足に分ける
function splitCity(c) {
  const m = String(c || "").match(/^(.*?)（(.*)）$/);
  return m ? { main: m[1], note: m[2] } : { main: String(c || ""), note: "" };
}
function calcDuration(x) {
  if (!x.departDate || !x.departTime || !x.arriveDate || !x.arriveTime) return "";
  const d = Date.parse(`${x.departDate}T${x.departTime}:00Z`) - effTZ(x, "depart") * 36e5;
  const a = Date.parse(`${x.arriveDate}T${x.arriveTime}:00Z`) - effTZ(x, "arrive") * 36e5;
  const diff = a - d;
  if (isNaN(diff) || diff < 0) return "";
  return `${Math.floor(diff / 36e5)}h${pad(Math.round((diff % 36e5) / 6e4))}m`;
}

// ================= 時差（都市名・空港名から自動で推定） =================
// 名前に含まれる語 → タイムゾーン。夏時間はその日付で Intl が計算する
const TZ_WORDS = [
  ["Asia/Tokyo", "日本 関西 関空 KIX 成田 NRT 羽田 HND 伊丹 ITM 中部 NGO セントレア 福岡 FUK 新千歳 CTS 那覇 OKA 東京 大阪 京都 名古屋 札幌 沖縄 神戸 広島 仙台"],
  ["Asia/Taipei", "台湾 台北 桃園 TPE 松山 TSA 高雄 KHH 台中 台南 花蓮 九份"],
  ["Asia/Seoul", "韓国 ソウル 仁川 ICN 金浦 GMP 釜山 PUS 済州"],
  ["Asia/Hong_Kong", "香港 HKG"], ["Asia/Macau", "マカオ MFM"],
  ["Asia/Shanghai", "中国 上海 北京 PVG PEK 広州 深セン 成都 大連 青島"],
  ["Asia/Bangkok", "タイ バンコク BKK DMK プーケット HKT チェンマイ"],
  ["Asia/Singapore", "シンガポール SIN"], ["Asia/Kuala_Lumpur", "マレーシア クアラルンプール KUL ペナン"],
  ["Asia/Ho_Chi_Minh", "ベトナム ホーチミン SGN ハノイ HAN ダナン DAD"],
  ["Asia/Manila", "フィリピン マニラ MNL セブ CEB"], ["Asia/Makassar", "バリ デンパサール DPS"], ["Asia/Jakarta", "ジャカルタ CGK"],
  ["Asia/Kolkata", "インド デリー ムンバイ"], ["Asia/Dubai", "ドバイ DXB アブダビ AUH UAE"], ["Asia/Qatar", "ドーハ DOH カタール"],
  ["Europe/Istanbul", "トルコ イスタンブール IST"],
  ["Pacific/Honolulu", "ハワイ ホノルル HNL"], ["Pacific/Guam", "グアム GUM"], ["Pacific/Saipan", "サイパン SPN"],
  ["America/Los_Angeles", "ロサンゼルス LAX サンフランシスコ SFO ラスベガス LAS シアトル SEA"], ["America/New_York", "ニューヨーク JFK ボストン ワシントン"],
  ["America/Vancouver", "バンクーバー YVR"], ["Australia/Sydney", "シドニー SYD メルボルン"],
  ["Europe/London", "イギリス ロンドン LHR LGW STN エディンバラ マンチェスター"],
  ["Europe/Dublin", "アイルランド ダブリン"], ["Europe/Lisbon", "ポルトガル リスボン ポルト"],
  ["Europe/Paris", "フランス パリ CDG ニース リヨン"], ["Europe/Brussels", "ベルギー ブリュッセル BRU ブルージュ"],
  ["Europe/Amsterdam", "オランダ アムステルダム AMS"], ["Europe/Luxembourg", "ルクセンブルク"],
  ["Europe/Berlin", "ドイツ ベルリン ミュンヘン MUC フランクフルト FRA ハンブルク ケルン"],
  ["Europe/Zurich", "スイス チューリッヒ ジュネーブ インターラーケン"],
  ["Europe/Vienna", "オーストリア ウィーン VIE ザルツブルク"], ["Europe/Prague", "チェコ プラハ PRG チェスキー"],
  ["Europe/Bratislava", "スロバキア ブラチスラヴァ ブラチスラバ"], ["Europe/Budapest", "ハンガリー ブダペスト BUD"],
  ["Europe/Warsaw", "ポーランド ワルシャワ WAW クラクフ KRK"],
  ["Europe/Copenhagen", "デンマーク コペンハーゲン CPH"], ["Europe/Stockholm", "スウェーデン ストックホルム ARN ヨンショーピング ヨーテボリ"],
  ["Europe/Oslo", "ノルウェー オスロ"], ["Europe/Helsinki", "フィンランド ヘルシンキ HEL"],
  ["Europe/Tallinn", "エストニア タリン TLL"], ["Europe/Riga", "ラトビア リガ"], ["Europe/Vilnius", "リトアニア ビリニュス"],
  ["Europe/Madrid", "スペイン マドリード MAD バルセロナ BCN セビリア"],
  ["Europe/Rome", "イタリア ローマ FCO ミラノ MXP ヴェネチア ベネチア VCE フィレンツェ ナポリ"],
  ["Europe/Zagreb", "クロアチア ザグレブ スプリット SPU ドゥブロヴニク ドブロブニク DBV"],
  ["Europe/Ljubljana", "スロベニア リュブリャナ"], ["Europe/Athens", "ギリシャ アテネ ATH サントリーニ"],
  ["Europe/Malta", "マルタ スリーマ バレッタ MLA ゴゾ"],
];
const TZ_INDEX = TZ_WORDS.flatMap(([zone, words]) => words.split(" ").map(w => [w, zone])).sort((a, b) => b[0].length - a[0].length);
// 名前から [語, タイムゾーン]。いちばん長く一致した語を使う（「ヨンショーピング/ストックホルム」なども可）
function tzMatch(name) {
  const n = String(name || "");
  const hit = TZ_INDEX.find(([w]) => /^[A-Z]{3}$/.test(w) ? new RegExp(`(^|[^A-Za-z])${w}([^A-Za-z]|$)`).test(n) : n.includes(w));
  return hit ? { word: hit[0], zone: hit[1] } : null;
}
// その日付での UTC からの時差（時間）。夏時間を含む
function tzOffset(zone, iso) {
  try {
    const d = new Date((isISO(iso) ? iso : todayISO()) + "T12:00:00Z");
    const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(d).find(p => p.type === "timeZoneName");
    const m = String(part && part.value).match(/GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?/);
    if (!m) return null;
    return m[1] ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3] || 0) / 60) : 0;
  } catch (e) { return null; }
}
// 移動の出発側・到着側の時差。手で入れた値があればそれ、なければ都市名から自動
function effTZ(x, side) {
  const manual = side === "depart" ? x.departTZManual : x.arriveTZManual;
  const stored = side === "depart" ? x.departTZ : x.arriveTZ;
  if (manual) return Number(stored) || 0;
  const m = tzMatch(side === "depart" ? x.fromCity : x.toCity);
  const off = m ? tzOffset(m.zone, side === "depart" ? x.departDate : (x.arriveDate || x.departDate)) : null;
  return off === null ? Number(stored) || 0 : off;
}
function tzSource(x, side) {
  if (side === "depart" ? x.departTZManual : x.arriveTZManual) return "手入力";
  const m = tzMatch(side === "depart" ? x.fromCity : x.toCity);
  return m ? `自動（${m.word}）` : "都市名から分からないため手入力してください";
}
const fmtTZ = (n) => `UTC${n >= 0 ? "+" : "−"}${Math.abs(n) % 1 ? Math.abs(n).toFixed(1).replace(".5", ":30") : Math.abs(n)}`;

// ================= 旅行データの形 =================
const MODES = ["飛行機", "鉄道", "夜行列車", "バス", "フェリー", "夜行フェリー", "車", "地下鉄", "タクシー", "徒歩", "その他", "未定"];
// 街の中で使うことが多い手段（旅程の骨組み・ルートマップには入れない）
const SHORT_MODES = ["地下鉄", "タクシー", "徒歩", "その他"];
const LOCAL_CATS = ["観光", "食事", "ツアー", "入場券", "買い物", "その他体験"];
const BOOKED = ["予約済み（キャンセル無料）", "予約済み（変更可能）", "予約済み（変更キャンセル不可）"];
const POLICY_LABEL = { "予約済み（キャンセル無料）": "無料キャンセル可", "予約済み（変更可能）": "変更可", "予約済み（変更キャンセル不可）": "変更・キャンセル不可" };
const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => `${pad(6 + Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`);

function emptyTrip(name, startDate, nights) {
  return {
    name: name || "新しい旅行", gmailLabel: "", createdAt: new Date().toISOString(),
    itinerary: startDate ? [{ id: uid(), type: "stay", city: "", startDate, nights: nights === 0 ? 0 : (Number(nights) || 1), memo: "", status: "未確定", dates: "", noHotel: false }] : [],
    hotels: [], localTransport: [],
    budget: [
      { id: 1, category: "交通費", target: 0, auto: true },
      { id: 2, category: "宿泊", target: 0, auto: true },
      { id: 4, category: "観光・体験", target: 0, auto: true },
      { id: 5, category: "食費", target: 0, auto: false, actual: 0 },
      { id: 6, category: "予備費", target: 0, auto: false, actual: 0 },
    ],
    totalBudget: 0,
    packing: {
      "書類": [{ id: uid(), name: "パスポート", checked: false, bag: "" }, { id: uid(), name: "予約確認書", checked: false, bag: "" }],
      "電子機器": [{ id: uid(), name: "充電ケーブル", checked: false, bag: "" }, { id: uid(), name: "変換プラグ", checked: false, bag: "" }],
      "衣類": [], "洗面・薬": [],
    },
    participants: [], dayParticipants: {}, myName: "",
  };
}

// 旧版（travel-manager）のデータを読み込むときの手当て：宿のカードがない滞在は「宿不要」として扱う
function upgradeTrip(t) {
  const out = { ...emptyTrip(t.name), ...t };
  let itin = (t.itinerary || []).map(s => {
    if (s.type === "transit" || s.noHotel !== undefined) return s;
    const has = (t.hotels || []).some(h => h.linkedStayId === s.id);
    return has ? { ...s, noHotel: false } : { ...s, noHotel: true, lodgingLabel: "宿不要" };
  });
  // 旧版では「現地の予定」の中にも移動があった。移動は1種類にまとめる
  const oldMoves = (t.localTransport || []).filter(l => l.category === "移動");
  if (oldMoves.length) {
    itin = [...itin, ...oldMoves.map(localToMove)];
    out.localTransport = (t.localTransport || []).filter(l => l.category !== "移動");
  }
  out.itinerary = markLegs(itin);
  // かばんは固定にせず、旅行ごとに自分で決める。旧版で使っていたかばんは引き継ぐ
  if (!Array.isArray(t.bags)) out.bags = [...new Set(Object.values(t.packing || {}).flat().map(i => i.bag).filter(Boolean))];
  // 予算の「移動費」と「現地交通」は「交通費」1つに
  const b = out.budget || [];
  const local = b.find(x => x.auto && x.category === "現地交通"), move = b.find(x => x.auto && String(x.category || "").startsWith("移動費"));
  if (move || local) {
    out.budget = b.filter(x => x !== local).map(x => x === move ? { ...x, category: "交通費", target: (Number(x.target) || 0) + (local ? Number(local.target) || 0 : 0) } : x);
    if (!move && local) out.budget = [...out.budget, { ...local, category: "交通費" }];
  }
  return out;
}
function localToMove(l) {
  const m = String(l.mode || "") + " " + String(l.desc || "");
  const mode = /飛行機|フライト/.test(m) ? "飛行機" : /船|フェリー|ferry|Ferry/.test(m) ? "フェリー" : /地下鉄|メトロ|Metro|metro|MRT/.test(m) ? "地下鉄"
    : /電車|鉄道|列車|JR|新幹線|空港鉄道|AREX/.test(m) ? "鉄道" : /バス|Bus|bus|リムジン/.test(m) ? "バス" : /タクシー|Uber|uber|Grab|送迎/.test(m) ? "タクシー"
    : /レンタカー|車/.test(m) ? "車" : /徒歩|歩/.test(m) ? "徒歩" : "その他";
  return {
    id: l.id, type: "transit", mode, desc: l.desc || "", fromCity: l.fromAddress || "", toCity: l.toAddress || "",
    departDate: l.date || "", departTime: l.startTime || "", arriveDate: l.date || "", arriveTime: l.endTime || "",
    airline: "", transitStops: "", cls: "", price: Number(l.price) || 0, people: l.people || 1, miles: false, memo: l.memo || "",
    status: l.status || "候補", paymentStatus: l.paymentStatus || "未払い", needsBooking: !!l.needsBooking,
  };
}
// 旅程の骨組みになる移動（都市から都市へ）か。街の中の移動や、滞在の途中の日帰りは骨組みに入れない
function markLegs(list) {
  const stays = (list || []).filter(r => r.type !== "transit" && isISO(r.startDate));
  return (list || []).map(r => {
    if (r.type !== "transit") return r;
    const inside = isISO(r.departDate) && stays.some(s => s.startDate < r.departDate && r.departDate < stayEnd(s));
    const leg = !SHORT_MODES.includes(r.mode) && !inside;
    return r.leg === leg ? r : { ...r, leg };
  });
}
const isLeg = (x) => x.leg !== false;
// 予約が必要か（決めていなければ、骨組みの移動は必要・街の中の移動は不要）
const needsBookingOf = (x) => x.needsBooking === undefined ? isLeg(x) : !!x.needsBooking;

// 「プラハの宿」のような呼び名。都市が未入力なら日付で呼ぶ
function stayTitle(s, what) {
  const c = splitCity(s.city).main;
  return c ? `${c}の${what}` : `${s.startDate ? md(s.startDate) + "からの" : ""}${what}（都市が未入力）`;
}
const stayShort = (s) => splitCity(s.city).main || (s.startDate ? `${md(s.startDate)}〜の滞在` : "都市未入力");
const staysOf = (t) => (t.itinerary || []).filter(d => d.type !== "transit");
const transitsOf = (t) => (t.itinerary || []).filter(d => d.type === "transit");
const nightsOf = (s) => Math.max(0, Number(s.nights) || 0);
const stayEnd = (s) => addDays(s.startDate, Math.max(1, nightsOf(s)));
const hotelOf = (t, s) => (t.hotels || []).find(h => h.linkedStayId === s.id);
const dateKey = (r) => (r.type === "transit" ? r.departDate : r.startDate) || "9999-12-31";

// 日付順（同じ日なら移動→滞在）
function sortItinerary(list) {
  return list.map((r, i) => [r, i]).sort((a, b) => {
    const ka = dateKey(a[0]), kb = dateKey(b[0]);
    if (ka !== kb) return ka < kb ? -1 : 1;
    if (a[0].type !== b[0].type) return a[0].type === "transit" ? -1 : 1;
    return a[1] - b[1];
  }).map(x => x[0]);
}

// 並べ替えたうえで、隣り合う滞在の間に移動がなければ「手段未定」の移動を入れ、滞在の日付表記をそろえる
function normalizeItinerary(list) {
  const all = sortItinerary(markLegs(list));
  // 間の移動が抜けているかは、骨組み（滞在と都市間の移動）だけで判断する
  const sorted = all.filter(r => r.type !== "transit" || isLeg(r));
  const out = all.filter(r => r.type === "transit" && !isLeg(r));
  sorted.forEach((cur, i) => {
    const row = cur.type === "transit" ? cur : { ...cur, dates: cur.startDate ? `${md(cur.startDate)}(${wdOf(cur.startDate)})-${md(stayEnd(cur))}(${wdOf(stayEnd(cur))})` : "" };
    out.push(row);
    const nxt = sorted[i + 1];
    if (row.type !== "transit" && row.city && nxt && nxt.type !== "transit" && nxt.city) {
      const d = row.startDate ? stayEnd(row) : (nxt.startDate || "");
      out.push({ id: uid(), type: "transit", mode: "未定", fromCity: row.city, toCity: nxt.city, departDate: d, departTime: "", departTZ: 9, arriveDate: d, arriveTime: "", arriveTZ: 9, airline: "", transitStops: "", cls: "", price: 0, miles: false, memo: "", status: "候補", paymentStatus: "未払い" });
    }
  });
  return markLegs(sortItinerary(out));
}

// 無料版の数え方：帰ってくる日がまだ来ていない旅行と、日程が未定の旅行は「進行中」。旅行パスを使った旅行は数えない
const isActiveTrip = (t) => { const r = tripRange(t); return !t.tripPass && (!r || r.end >= todayISO()); };
const activeTripCount = (list) => list.filter(x => isActiveTrip(x.data)).length;
const FREE_LIMIT_MSG = "無料版では、旅行を1つずつ準備できます（機能はすべて使えます）。終わった旅行はいくつでも残せます。2つ目の旅行を同時に準備するには、旅行パス（1旅行440円）か3か月パス（980円）が必要です（2026年12月1日から）。";
function tripRange(t) {
  const dates = [];
  staysOf(t).forEach(s => { if (isISO(s.startDate)) { dates.push(s.startDate, stayEnd(s)); } });
  transitsOf(t).forEach(x => { if (isISO(x.departDate)) dates.push(x.departDate); if (isISO(x.arriveDate)) dates.push(x.arriveDate); });
  if (!dates.length) return null;
  dates.sort();
  return { start: dates[0], end: dates[dates.length - 1], days: dayDiff(dates[0], dates[dates.length - 1]) + 1 };
}

// ================= 手配の状態（未手配 → 予約済み → 支払い済み） =================
const ST = {
  open: { key: "open", label: "未手配", tone: "open" },
  cand: { key: "cand", label: "候補あり", tone: "open" },
  unknown: { key: "unknown", label: "手段未定", tone: "open" },
  unbooked: { key: "unbooked", label: "未予約", tone: "open" },
  need: { key: "need", label: "要予約", tone: "open" },
  booked: { key: "booked", label: "予約済み", tone: "booked" },
  paid: { key: "paid", label: "支払い済み", tone: "paid" },
  none: { key: "none", label: "宿不要", tone: "none" },
  free: { key: "free", label: "予約不要", tone: "none" },
};
const isBooked = (s) => String(s || "").startsWith("予約済み");
function stayState(t, s) {
  if (s.noHotel) return { ...ST.none, label: s.lodgingLabel || "宿不要" };
  const h = hotelOf(t, s);
  if (h && isBooked(h.status)) return h.paymentStatus === "支払い済み" ? ST.paid : ST.booked;
  if (h && (h.name || Number(h.total) > 0)) return ST.cand;
  return ST.open;
}
function transitState(x) {
  if (isBooked(x.status)) return x.paymentStatus === "支払い済み" ? ST.paid : ST.booked;
  if (!needsBookingOf(x)) return ST.free;
  if (!x.mode || x.mode === "未定") return ST.unknown;
  return ST.unbooked;
}
function localState(l) {
  if (isBooked(l.status)) return l.paymentStatus === "支払い済み" ? ST.paid : ST.booked;
  return l.needsBooking ? ST.need : ST.free;
}
const isOpenState = (st) => st.tone === "open";
// 移動の呼び名（出発地 → 到着地。分からなければ内容や手段）
function moveTitle(x) {
  const short = (v) => splitCity(v).main.split(/[,，、]/)[0].trim();
  const a = short(x.fromCity), b = short(x.toCity);
  return a && b ? `${a} → ${b}` : x.desc || (b ? `${b}へ` : a ? `${a}から` : (x.mode && x.mode !== "未定" ? x.mode : "移動"));
}

// ================= 集計 =================
function tripStats(t) {
  const stays = staysOf(t);
  const nights = { booked: 0, open: 0, none: 0, total: 0 };
  stays.forEach(s => {
    const n = nightsOf(s), st = stayState(t, s);
    nights.total += n;
    if (st.tone === "none") nights.none += n; else if (st.tone === "open") nights.open += n; else nights.booked += n;
  });
  const tr = transitsOf(t), legs = tr.filter(x => transitState(x).key !== "free");
  const moves = { total: legs.length, booked: 0, decided: 0, unknown: 0 };
  legs.forEach(x => { const st = transitState(x); if (st.tone !== "open") moves.booked++; else if (st.key === "unknown") moves.unknown++; else moves.decided++; });
  const hotelSum = (t.hotels || []).filter(h => !staysOf(t).find(s => s.id === h.linkedStayId && s.noHotel)).reduce((a, h) => a + (Number(h.total) || 0), 0);
  const moveSum = tr.reduce((a, x) => a + (Number(x.price) || 0), 0);
  const localMove = (t.localTransport || []).filter(l => l.category === "移動").reduce((a, l) => a + (Number(l.price) || 0), 0);
  const localAct = (t.localTransport || []).filter(l => l.category !== "移動").reduce((a, l) => a + (Number(l.price) || 0), 0);
  const paid = [...(t.hotels || []), ...tr, ...(t.localTransport || [])].filter(x => x.paymentStatus === "支払い済み")
    .reduce((a, x) => a + (Number(x.total ?? x.price) || 0), 0);
  const cities = new Set(stays.map(s => splitCity(s.city).main).filter(Boolean));
  return { nights, moves, hotelSum, moveSum, localMove, localAct, local: localMove + localAct, estimate: hotelSum + moveSum + localMove + localAct, paid, cities: cities.size };
}

// 人ごとの負担（日ごとの参加者で割る）— 旧版の精算ロジックと同じ
function personBreakdown(t) {
  const participants = t.participants || [], dp = t.dayParticipants || {};
  const members = (iso) => { const m = dp[iso]; return (m && m.length ? m : participants).filter(p => participants.includes(p)); };
  const data = {};
  participants.forEach(p => { data[p] = { total: 0, hotel: 0, flight: 0, localTransport: 0, localActivity: 0, items: [] }; });
  const add = (who, amount, key, label, category, date) => who.forEach(p => { data[p].total += amount; data[p][key] += amount; data[p].items.push({ label, amount, category, date }); });
  (t.hotels || []).forEach(h => {
    const s = staysOf(t).find(x => x.id === h.linkedStayId);
    if (!s || !s.startDate || s.noHotel) return;
    const n = Math.max(1, nightsOf(s)), per = (Number(h.total) || 0) / n;
    if (!per) return;
    for (let i = 0; i < n; i++) {
      const iso = addDays(s.startDate, i), who = members(iso);
      if (who.length) add(who, per / who.length, "hotel", `${h.name || splitCity(s.city).main} ${md(iso)}（${who.length}人割）`, "宿", iso);
    }
  });
  transitsOf(t).forEach(x => {
    if (!(Number(x.price) > 0) || !x.departDate) return;
    const who = members(x.departDate);
    if (who.length) add(who, Number(x.price) / who.length, "flight", `${moveTitle(x)} ${md(x.departDate)}（${who.length}人割）`, "交通", x.departDate);
  });
  (t.localTransport || []).forEach(l => {
    if (!(Number(l.price) > 0) || !l.date) return;
    const who = members(l.date);
    if (who.length) add(who, Number(l.price) / who.length, l.category === "移動" ? "localTransport" : "localActivity", `${l.desc || l.category} ${md(l.date)}（${who.length}人割）`, "現地", l.date);
  });
  Object.values(data).forEach(d => d.items.sort((a, b) => (a.date || "").localeCompare(b.date || "")));
  return data;
}

// 1人分の負担。「精算」で自分を選んでいれば日ごとの参加者で割った額、そうでなければ各項目の金額 ÷ 人数
const peopleOf = (x) => Math.max(1, Number(x.people ?? x.guests) || 1);
function myShare(t) {
  const pb = (t.myName && (t.participants || []).includes(t.myName)) ? personBreakdown(t)[t.myName] : null;
  if (pb) return { mode: "split", hotel: pb.hotel, flight: pb.flight, localTransport: pb.localTransport, localActivity: pb.localActivity, total: pb.total, paid: null };
  const noHotel = new Set(staysOf(t).filter(s => s.noHotel).map(s => s.id));
  const hs = (t.hotels || []).filter(h => !noHotel.has(h.linkedStayId));
  const sum = (list, key) => list.reduce((a, x) => a + (Number(x[key]) || 0) / peopleOf(x), 0);
  const loc = t.localTransport || [];
  const r = { mode: "people", hotel: sum(hs, "total"), flight: sum(transitsOf(t), "price"), localTransport: sum(loc.filter(l => l.category === "移動"), "price"), localActivity: sum(loc.filter(l => l.category !== "移動"), "price") };
  r.total = r.hotel + r.flight + r.localTransport + r.localActivity;
  r.paid = sum(hs.filter(h => h.paymentStatus === "支払い済み"), "total") + sum([...transitsOf(t), ...loc].filter(x => x.paymentStatus === "支払い済み"), "price");
  return r;
}

function budgetActual(b, stats, mine) {
  if (!b.auto) return Number(b.actual) || 0;
  const c = b.category || "";
  const move = c.startsWith("移動費") || c === "交通費";
  if (mine) return move ? mine.flight + mine.localTransport : c === "宿泊" ? mine.hotel : c === "現地交通" ? 0 : c === "観光・体験" ? mine.localActivity : 0;
  return move ? stats.moveSum + stats.localMove : c === "宿泊" ? stats.hotelSum : c === "現地交通" ? 0 : c === "観光・体験" ? stats.localAct : 0;
}

// ================= 今やること =================
function buildTodos(t, inboxCount) {
  const todos = [];
  if (inboxCount > 0) todos.push({ icon: "mail", title: "予約メールを確認する", sub: `取り込み候補が${inboxCount}件あります`, tag: `${inboxCount}件`, go: { tab: "book" } });
  const tr = transitsOf(t);
  const flights = tr.filter(x => x.mode === "飛行機" && transitState(x).tone === "open");
  if (flights.length) todos.push({ icon: "plane", title: flights.length === 1 ? "航空券を予約する" : `航空券を予約する（${flights.length}便）`, sub: flights.map(x => `${splitCity(x.fromCity).main}→${splitCity(x.toCity).main}`).join("・"), tag: "未予約", edit: flights.length === 1 ? { kind: "transit", id: flights[0].id } : null, go: { tab: "book", filter: "open" } });
  const stays = staysOf(t).filter(s => isISO(s.startDate));
  const open = stays.filter(s => stayState(t, s).key === "open").sort((a, b) => nightsOf(b) - nightsOf(a));
  open.slice(0, 2).forEach(s => todos.push({ icon: "bed", title: stayTitle(s, "宿を予約"), sub: `${md(s.startDate)}〜${md(stayEnd(s))} ・ ${nightsOf(s)}泊`, tag: "未手配", edit: { kind: "stay", id: s.id } }));
  stays.filter(s => stayState(t, s).key === "cand").forEach(s => { const h = hotelOf(t, s); todos.push({ icon: "bed", title: stayTitle(s, "宿を予約"), sub: `${md(s.startDate)}〜${md(stayEnd(s))} ・ 候補あり${Number(h.total) > 0 ? " " + yen(h.total) : ""}`, tag: "候補あり", edit: { kind: "stay", id: s.id } }); });
  const rest = open.slice(2);
  if (rest.length) todos.push({ icon: "bed", title: `ほか${rest.length}都市の宿を予約`, sub: `${rest.map(stayShort).join("・")} ・ 計${rest.reduce((a, s) => a + nightsOf(s), 0)}泊`, tag: "未手配", go: { tab: "book", filter: "open", type: "stay" } });
  const unknown = tr.filter(x => transitState(x).key === "unknown");
  if (unknown.length) todos.push({ icon: "route", title: "移動手段を決める", sub: `${splitCity(unknown[0].fromCity).main}→${splitCity(unknown[0].toCity).main}${unknown.length > 1 ? ` ほか${unknown.length - 1}区間` : ""}`, tag: "未定", go: { tab: "book", filter: "open", type: "transit" } });
  const decided = tr.filter(x => x.mode !== "飛行機" && transitState(x).key === "unbooked");
  if (decided.length) todos.push({ icon: "train", title: "列車・船などを予約する", sub: `${decided.length}区間（${decided.slice(0, 2).map(x => `${splitCity(x.fromCity).main}→${splitCity(x.toCity).main}`).join("・")}${decided.length > 2 ? " など" : ""}）`, tag: "未予約", go: { tab: "book", filter: "open", type: "transit" } });
  const need = (t.localTransport || []).filter(l => localState(l).key === "need");
  if (need.length) todos.push({ icon: "ticket", title: "要予約の現地手配", sub: need.slice(0, 2).map(l => l.desc).join("・") + (need.length > 2 ? " など" : ""), tag: `${need.length}件`, go: { tab: "book", filter: "open", type: "local" } });
  // 出発前の手続き
  const today = todayISO();
  if (tripCountries(t).length) {
    if (!t.entryChecks) todos.unshift({ icon: "check", title: "出発前の手続きを確認する", sub: `${tripCountries(t).map(c => c.country).join("・")}の入国に必要なもの（ビザ・渡航認証など）`, tag: "未確認", go: { tab: "book" } });
    else {
      const ec = t.entryChecks.items.filter(i => !i.done).sort((a, b) => (a.applyBy || "9").localeCompare(b.applyBy || "9"));
      ec.slice(0, 2).reverse().forEach(i => { const soon = i.applyBy && dayDiff(today, i.applyBy) <= 30; todos.unshift({ icon: "check", title: i.title, sub: `${i.country}${i.applyBy ? ` ・ ${md(i.applyBy)}までに` : ""}`, tag: soon ? "期限近い" : "手続き", urgent: soon, go: { tab: "book" } }); });
      if (ec.length > 2) todos.splice(2, 0, { icon: "check", title: `ほかの手続き ${ec.length - 2}件`, sub: ec.slice(2, 4).map(i => i.title).join("・"), tag: "手続き", go: { tab: "book" } });
    }
  }
  // 期限が近いもの（30日以内）
  (t.hotels || []).forEach(h => {
    if (isISO(h.cancelDeadline) && dayDiff(today, h.cancelDeadline) >= 0 && dayDiff(today, h.cancelDeadline) <= 30) {
      const s = staysOf(t).find(x => x.id === h.linkedStayId);
      todos.unshift({ icon: "clock", title: `${h.name || (s ? splitCity(s.city).main : "宿")}の無料キャンセル期限`, sub: `${md(h.cancelDeadline)}まで（あと${dayDiff(today, h.cancelDeadline)}日）`, tag: "期限", urgent: true, edit: s ? { kind: "stay", id: s.id } : null });
    }
  });
  return todos;
}

// ================= 予約メールの読み取り =================
const GMAIL_HOST_SERVERS = ["host:Google_Workspace_MCP", "host:workspace-mcp"];
const SCAN_BATCH = 12;
const GMAIL_QUERY = "newer_than:1y -category:promotions -category:social (category:reservations OR " +
  "subject:(予約 OR 確定 OR キャンセル OR booking OR reservation OR confirmation OR confirmed OR cancelled OR itinerary OR e-ticket) OR " +
  "from:(airbnb OR booking.com OR expedia OR agoda OR hotels.com OR trip.com OR trainline OR omio OR ryanair OR easyjet OR getyourguide OR klook OR viator))";
const gmailQueryFor = (label) => { const l = String(label || "").trim().replace(/"/g, ""); return l ? `label:"${l}"` : GMAIL_QUERY; };
const BOOKING_DEFAULTS = { kind: "other", booking_status: "unknown", summary: "", provider: "", name: "", city: "", address: "", checkin_date: "", checkout_date: "", checkin_time: "", checkout_time: "", guests: 0, total_amount: 0, currency: "", cancel_policy: "unknown", cancel_deadline: "", paid: "unknown", confirmation: "", manage_url: "", transport_mode: "", from_place: "", to_place: "", depart_date: "", depart_time: "", arrive_date: "", arrive_time: "", carrier: "", seat_class: "", activity_date: "", activity_time: "", matched_item_id: 0 };

function mcpText(res) {
  const p = res && res.payload;
  if (typeof p === "string") return p;
  if (p && typeof p.result === "string") return p.result;
  return ((res && res.content) || []).filter(b => b.type === "text").map(b => b.text).join("\n");
}
function parseGmailSearch(text) {
  const out = []; let cur = null;
  String(text || "").split("\n").forEach(line => {
    let m;
    if ((m = line.match(/^\s*\d+\.\s*Message ID:\s*(\S+)/))) { cur = { id: m[1], subject: "", from: "", date: "", url: "" }; out.push(cur); return; }
    if (!cur) return;
    if ((m = line.match(/^\s*Subject:\s*(.*)$/))) cur.subject = m[1];
    else if ((m = line.match(/^\s*From:\s*(.*)$/))) cur.from = m[1];
    else if ((m = line.match(/^\s*Date:\s*(.*)$/))) cur.date = m[1];
    else if ((m = line.match(/^\s*Web Link:\s*(\S+)/))) cur.url = m[1];
  });
  return out.filter(x => x.id && x.id !== "unknown").map(x => { const ts = Date.parse(x.date); return { ...x, isoDate: isNaN(ts) ? "" : new Date(ts).toISOString() }; });
}
async function searchPersonalGmail(mcp, args) {
  let last = null;
  for (const srv of GMAIL_HOST_SERVERS) {
    try { return { srv, res: await mcp.callTool(srv, "search_gmail_messages", args) }; }
    catch (e) { last = e; if (!["server_not_connected", "server_not_found", "not_in_manifest"].includes(e && e.code)) throw e; }
  }
  throw last || { code: "server_not_connected" };
}
function cleanMailBody(s) {
  return String(s || "").split("\n").map(l => l.replace(/^\s*\|\s?|\s?\|\s*$/g, "").trim())
    .filter(l => l && !/^[|\s#]*$/.test(l)).join("\n").replace(/\n{3,}/g, "\n\n").slice(0, 12000);
}
function bookingPrompt(msg, t) {
  const r = tripRange(t);
  const context = {
    period: r ? `${r.start}〜${r.end}` : "未定",
    stays: staysOf(t).map(d => ({ id: d.id, city: d.city, startDate: d.startDate, nights: d.nights })),
    transits: transitsOf(t).map(d => ({ id: d.id, mode: d.mode, from: d.fromCity, to: d.toCity, departDate: d.departDate })),
  };
  return `あなたは旅行の予約確認メールを読み取るアシスタントです。次のメールが、下の旅程（旅行名「${t.name}」、期間 ${context.period}）のための宿・交通・ツアー・入場券などの「予約」に関するメール（予約確定・変更・キャンセル・支払い完了の通知）かを判定し、JSONだけを返してください。
宣伝、ニュースレター、検索結果やおすすめ、レビュー依頼、仕事の会議室やイベントの予約、この旅程の期間と関係ない旅行の予約は is_booking=false にしてください。

返すJSONのキー（すべて必須。分からない文字列は ""、数値は 0）:
${JSON.stringify({ is_booking: true, ...BOOKING_DEFAULTS })}

ルール:
- kind: "hotel" | "transport" | "activity" | "other"
- booking_status: "confirmed" | "cancelled" | "changed" | "pending" | "unknown"
- cancel_policy: "free_cancel"（無料キャンセル可）| "changeable"（変更可）| "non_refundable"（返金不可）| "unknown"
- paid: "paid" | "unpaid" | "unknown"
- transport_mode: "飛行機" | "鉄道" | "夜行列車" | "フェリー" | "夜行フェリー" | "バス" | "その他" | ""
- 日付は YYYY-MM-DD、時刻は24時間表記の HH:MM。
- hotel は checkin/checkout、transport は transport_mode と from/to/depart/arrive、activity は activity_date/activity_time を埋める。
- city、from_place、to_place は、旅程にある都市と同じ都市ならその日本語表記に合わせる。
- total_amount は税・手数料込みの合計金額、currency は ISO の通貨コード（JPY, EUR など）。
- provider は予約したサイトや会社。summary は日本語の1行要約（例：「プラハ Praha 1のゲストルーム 6/15〜6/19 予約確定」）。
- matched_item_id は、旅程の stays（宿）または transits（交通）のうちこの予約に当たる id。日付と都市から判断し、なければ 0。

旅程: ${JSON.stringify(context)}

--- メール ---
件名: ${msg.subject || ""}
差出人: ${msg.from || ""}
日時: ${msg.date || ""}

${cleanMailBody(msg.body || "")}`;
}
function normalizeBooking(raw) {
  if (!raw || typeof raw !== "object" || !raw.is_booking) return null;
  const e = { ...BOOKING_DEFAULTS };
  Object.keys(BOOKING_DEFAULTS).forEach(k => {
    const v = raw[k];
    if (typeof BOOKING_DEFAULTS[k] === "number") e[k] = Number(v) || 0; else if (typeof v === "string") e[k] = v.trim();
  });
  return e;
}

// 取り込み候補 1 件から「どこに何を書くか」を組み立てる。apply は旅行データを受け取り新しいデータを返す
const looselySame = (a, b) => !!a && !!b && (a.includes(b) || b.includes(a));
const bookedStatus = (p) => p === "free_cancel" ? BOOKED[0] : p === "non_refundable" ? BOOKED[2] : BOOKED[1];
const paymentOf = (paid) => paid === "paid" ? "支払い済み" : paid === "unpaid" ? "未払い" : "";
const HOTEL_LABELS = { name: "宿泊先名", site: "予約サイト", url: "予約ページ", confirmation: "予約番号", address: "住所", guests: "人数", checkinTime: "チェックイン", checkoutTime: "チェックアウト", total: "総額", cancelDeadline: "キャンセル期限", status: "状態", paymentStatus: "支払い" };
const TRANSIT_LABELS = { airline: "会社・便名", departTime: "出発時刻", arriveDate: "到着日", arriveTime: "到着時刻", cls: "クラス", price: "金額", status: "状態", paymentStatus: "支払い" };
function compact(obj) {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => { if (v !== "" && v !== null && v !== undefined && !(typeof v === "number" && v <= 0)) out[k] = v; });
  return out;
}
function buildProposal(e, t, yenAmount) {
  const stays = staysOf(t);
  const cancelled = e.booking_status === "cancelled";
  const statusFor = (cur) => cancelled ? "候補" : e.cancel_policy === "unknown" && isBooked(cur) ? cur : bookedStatus(e.cancel_policy);
  if (e.kind === "hotel") {
    const stay = stays.find(s => s.id === e.matched_item_id) || stays.find(s => s.startDate === e.checkin_date) || stays.find(s => looselySame(s.city, e.city));
    const hotel = stay ? hotelOf(t, stay) : null;
    let dateCheck = null;
    if (stay && e.checkin_date) {
      const end = stayEnd(stay), ok = stay.startDate === e.checkin_date && (!e.checkout_date || end === e.checkout_date);
      dateCheck = { ok, text: ok ? "日程と一致" : `日程は ${md(stay.startDate)}〜${md(end)}、メールは ${md(e.checkin_date)}〜${md(e.checkout_date)}` };
    }
    const patch = cancelled ? { status: "候補", confirmation: "" } : compact({
      name: e.name, site: e.provider, url: e.manage_url, confirmation: e.confirmation, address: e.address, guests: e.guests,
      checkinTime: e.checkin_time, checkoutTime: e.checkout_time, total: yenAmount, cancelDeadline: e.cancel_deadline,
      status: statusFor(hotel && hotel.status), paymentStatus: paymentOf(e.paid),
    });
    const before = hotel || {};
    return {
      target: stay ? `宿：${splitCity(stay.city).main}（${md(stay.startDate)}〜${md(stayEnd(stay))}）` : `宿：日程にない滞在（${e.city || "都市不明"}）を追加`,
      dateCheck,
      changes: Object.entries(patch).filter(([k, v]) => before[k] !== v).map(([k, v]) => [HOTEL_LABELS[k] || k, before[k], v]),
      apply: (tr) => {
        if (stay) {
          const hs = tr.hotels || [];
          const has = hs.some(h => h.linkedStayId === stay.id);
          const itinerary = tr.itinerary.map(x => x.id === stay.id ? { ...x, noHotel: false } : x);
          return { ...tr, itinerary, hotels: has ? hs.map(h => h.linkedStayId === stay.id ? { ...h, ...patch } : h) : [...hs, { id: uid(), linkedStayId: stay.id, city: stay.city, guests: 1, total: 0, status: "候補", paymentStatus: "未払い", ...patch }] };
        }
        if (!isISO(e.checkin_date)) return tr;
        const ns = { id: uid(), type: "stay", city: e.city || e.name || "新しい滞在", startDate: e.checkin_date, nights: isISO(e.checkout_date) ? Math.max(1, dayDiff(e.checkin_date, e.checkout_date)) : 1, memo: "", status: "未確定", noHotel: false };
        return { ...tr, itinerary: normalizeItinerary([...tr.itinerary, ns]), hotels: [...(tr.hotels || []), { id: uid(), linkedStayId: ns.id, city: ns.city, guests: 1, total: 0, status: "候補", paymentStatus: "未払い", ...patch }] };
      },
    };
  }
  if (e.kind === "transport") {
    const trs = transitsOf(t);
    const x = trs.find(r => r.id === e.matched_item_id)
      || trs.find(r => r.departDate === e.depart_date && (looselySame(r.fromCity, e.from_place) || looselySame(r.toCity, e.to_place)))
      || trs.find(r => r.departDate === e.depart_date && r.mode === e.transport_mode);
    if (x) {
      const patch = cancelled ? { status: "候補" } : compact({ airline: e.carrier, departTime: e.depart_time, arriveDate: e.arrive_date, arriveTime: e.arrive_time, cls: e.seat_class, price: yenAmount, status: statusFor(x.status), paymentStatus: paymentOf(e.paid), mode: x.mode === "未定" && MODES.includes(e.transport_mode) ? e.transport_mode : "" });
      return {
        target: `移動：${splitCity(x.fromCity).main} → ${splitCity(x.toCity).main}（${md(x.departDate)}）`,
        dateCheck: e.depart_date ? { ok: x.departDate === e.depart_date, text: x.departDate === e.depart_date ? "日程と一致" : `日程は ${md(x.departDate)} 出発、メールは ${md(e.depart_date)} 出発` } : null,
        changes: Object.entries(patch).filter(([k, v]) => x[k] !== v).map(([k, v]) => [TRANSIT_LABELS[k] || (k === "mode" ? "手段" : k), x[k], v]),
        apply: (tr) => ({ ...tr, itinerary: tr.itinerary.map(r => r.id === x.id ? { ...r, ...patch } : r) }),
      };
    }
  }
  if ((e.kind === "transport" || e.kind === "activity") && !cancelled) {
    const isMove = e.kind === "transport", date = isMove ? e.depart_date : e.activity_date;
    const stay = date ? stays.find(s => s.startDate && date >= s.startDate && date < stayEnd(s)) : null;
    const req = !!e.is_request;
    const row = {
      id: uid(), linkedStayId: stay ? stay.id : null, category: isMove ? "移動" : req ? (LOCAL_CATS.includes(e.category) ? e.category : "観光") : "ツアー",
      desc: isMove ? [e.carrier, e.from_place && e.to_place ? `${e.from_place}→${e.to_place}` : ""].filter(Boolean).join(" ") : e.name,
      address: isMove ? "" : e.address, fromAddress: isMove ? e.from_place : "", toAddress: isMove ? e.to_place : "",
      date, startTime: isMove ? e.depart_time : e.activity_time, endTime: isMove ? e.arrive_time : "", mode: isMove ? e.transport_mode : "",
      price: yenAmount || 0, needsBooking: false,
      memo: req ? `${e.provider ? e.provider + "さん" : "共有相手"}からのリクエスト${e.note ? "：" + e.note : ""}` : [e.provider, e.confirmation && `予約番号 ${e.confirmation}`].filter(Boolean).join(" / "),
      paymentStatus: paymentOf(e.paid) || "未払い", status: req ? "候補" : statusFor(""),
    };
    if (isMove) {
      const mv = localToMove({ ...row, needsBooking: true });
      return {
        target: `移動に追加（${moveTitle(mv)}）`,
        dateCheck: date ? { ok: true, text: md(date) } : null,
        changes: [["内容", "", row.desc], ["日時", "", `${md(date)} ${row.startTime}`.trim()], ["金額", "", yenAmount ? yen(yenAmount) : ""]].filter(r => r[2]),
        apply: (tr) => ({ ...tr, itinerary: normalizeItinerary([...tr.itinerary, mv]) }),
      };
    }
    return {
      target: req ? `予定に追加（${row.category}${date ? "" : "・日付未定"}）` : `現地手配に追加（${row.category}）`,
      dateCheck: date ? (stay ? { ok: true, text: `${splitCity(stay.city).main}の滞在中（${md(date)}）` } : { ok: false, text: `${md(date)} はどの滞在にも入っていません` }) : null,
      changes: [["内容", "", row.desc], ["日時", "", `${md(date)} ${row.startTime}`.trim()], ["金額", "", yenAmount ? yen(yenAmount) : ""]].filter(r => r[2]),
      apply: (tr) => ({ ...tr, localTransport: [...(tr.localTransport || []), row] }),
    };
  }
  return { target: cancelled ? "キャンセルの通知です。該当する予約を手で確認してください" : "自動で反映できない種類の予約です", dateCheck: null, changes: [], apply: null };
}

// ================= 書き出し =================
function buildICS(t) {
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TripPlanner//JP", "CALSCALE:GREGORIAN"];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const allDay = (iso) => iso.replace(/-/g, "");
  const utc = (d, tm, tz) => {
    if (!d || !tm) return null;
    const x = new Date(Date.parse(`${d}T${tm}:00Z`) - (Number(tz) || 0) * 36e5);
    return `${x.getUTCFullYear()}${pad(x.getUTCMonth() + 1)}${pad(x.getUTCDate())}T${pad(x.getUTCHours())}${pad(x.getUTCMinutes())}00Z`;
  };
  const ev = (id, lines) => L.push("BEGIN:VEVENT", `UID:${id}@tripplanner`, `DTSTAMP:${stamp}`, ...lines, "END:VEVENT");
  staysOf(t).filter(s => isISO(s.startDate)).forEach(s => {
    const h = hotelOf(t, s);
    ev(`stay-${s.id}`, [`DTSTART;VALUE=DATE:${allDay(s.startDate)}`, `DTEND;VALUE=DATE:${allDay(stayEnd(s))}`, `SUMMARY:${esc(splitCity(s.city).main + "（滞在）")}`, `LOCATION:${esc(h && h.address ? h.address : s.city)}`, `DESCRIPTION:${esc([h && h.name, s.memo].filter(Boolean).join(" / "))}`]);
  });
  transitsOf(t).filter(x => isISO(x.departDate)).forEach(x => {
    const a = utc(x.departDate, x.departTime, effTZ(x, "depart")), b = utc(x.arriveDate, x.arriveTime, effTZ(x, "arrive")) || a;
    ev(`move-${x.id}`, [...(a ? [`DTSTART:${a}`, `DTEND:${b}`] : [`DTSTART;VALUE=DATE:${allDay(x.departDate)}`, `DTEND;VALUE=DATE:${allDay(addDays(x.departDate, 1))}`]),
      `SUMMARY:${esc(`移動：${splitCity(x.fromCity).main} → ${splitCity(x.toCity).main}（${x.mode || ""}）`)}`, `DESCRIPTION:${esc([x.airline, x.memo].filter(Boolean).join(" / "))}`]);
  });
  (t.localTransport || []).filter(l => isISO(l.date)).forEach(l => {
    const a = utc(l.date, l.startTime, 9);
    ev(`local-${l.id}`, [`DTSTART;VALUE=DATE:${allDay(l.date)}`, `DTEND;VALUE=DATE:${allDay(addDays(l.date, 1))}`, `SUMMARY:${esc(`${l.startTime ? l.startTime + " " : ""}${l.desc || l.category}`)}`, `DESCRIPTION:${esc(l.memo)}`]);
  });
  L.push("END:VCALENDAR");
  return L.join("\r\n");
}
function buildSummaryText(t) {
  const L = [`# ${t.name}（旅程サマリー）`, "", "## 日程"];
  sortItinerary(t.itinerary || []).forEach(r => {
    if (r.type === "transit") L.push(`- [移動] ${r.fromCity} → ${r.toCity} ${r.mode || ""} ${md(r.departDate)} ${r.departTime || ""}${r.airline ? " " + r.airline : ""} ${transitState(r).label}${Number(r.price) > 0 ? " " + yen(r.price) : ""}`);
    else { const h = hotelOf(t, r); L.push(`- [滞在] ${r.city} ${md(r.startDate)}から${nightsOf(r)}泊 ${stayState(t, r).label}${h && h.name ? " " + h.name : ""}${h && Number(h.total) > 0 ? " " + yen(h.total) : ""}${r.memo ? `（${r.memo}）` : ""}`); }
  });
  L.push("", "## 現地手配");
  (t.localTransport || []).forEach(l => L.push(`- [${l.category}] ${md(l.date)} ${l.desc} ${localState(l).label}${Number(l.price) > 0 ? " " + yen(l.price) : ""}`));
  const s = tripStats(t);
  L.push("", "## お金", `予算 ${yen(t.totalBudget)} / 見込み ${yen(s.estimate)} / 支払い済み ${yen(s.paid)}`);
  L.push("", "## 持ち物");
  Object.entries(t.packing || {}).forEach(([c, items]) => L.push(`- ${c}：${items.map(i => i.name + (i.checked ? "✓" : "")).join("、")}`));
  return L.join("\n");
}

// 共有ページから LINE で届いたリクエストの文章を、予定の候補に分ける
function requestPrompt(text, t) {
  const r = tripRange(t);
  const days = r ? Array.from({ length: r.days }, (_, i) => { const d = addDays(r.start, i); const s = staysOf(t).find(x => x.startDate && d >= x.startDate && d < stayEnd(x)); return `${d}（${i + 1}日目・${s ? splitCity(s.city).main : "移動日"}）`; }) : [];
  return `旅行「${t.name}」の同行者から届いたリクエストの文章を読み、旅程に足す予定の候補に分けてください。JSONだけを返してください。
形式: {"from":"送ってきた人の名前（分からなければ空）","items":[{"title":"予定の名前（例：九份に行きたい）","category":"観光|食事|買い物|ツアー|入場券|その他体験","date":"YYYY-MM-DD（旅程の日付で、決まらなければ空）","time":"HH:MM（なければ空）","address":"場所や住所（なければ空）","note":"補足（なければ空）"}]}
「何日目」「○曜日」「最終日」などは下の日程から日付に直してください。予定にならない感想やあいさつは入れないでください。

日程: ${days.join(" / ")}

--- リクエスト ---
${String(text || "").slice(0, 6000)}`;
}

// ================= 入力の候補と推測 =================
const AIRPORTS = ["関西空港(KIX)", "成田空港(NRT)", "羽田空港(HND)", "伊丹空港(ITM)", "中部国際空港(NGO)", "福岡空港(FUK)", "新千歳空港(CTS)", "那覇空港(OKA)",
  "桃園空港(TPE)", "松山空港(TSA)", "高雄空港(KHH)", "仁川空港(ICN)", "金浦空港(GMP)", "金海空港(PUS)", "香港空港(HKG)", "上海浦東(PVG)", "バンコク・スワンナプーム(BKK)",
  "シンガポール・チャンギ(SIN)", "クアラルンプール(KUL)", "マニラ(MNL)", "セブ(CEB)", "ダナン(DAD)", "ホノルル(HNL)", "グアム(GUM)", "ロサンゼルス(LAX)",
  "ロンドン・ヒースロー(LHR)", "パリ・シャルルドゴール(CDG)", "フランクフルト(FRA)", "ミュンヘン(MUC)", "アムステルダム(AMS)", "ヘルシンキ(HEL)", "ウィーン(VIE)",
  "ドバイ(DXB)", "アブダビ(AUH)", "ドーハ(DOH)", "イスタンブール(IST)", "ローマ(FCO)", "ミラノ(MXP)", "バルセロナ(BCN)", "マドリード(MAD)", "アテネ(ATH)",
  "マルタ(MLA)", "スプリット(SPU)", "ドゥブロヴニク(DBV)", "クラクフ(KRK)", "ワルシャワ(WAW)", "プラハ(PRG)", "ブダペスト(BUD)", "コペンハーゲン(CPH)", "ストックホルム(ARN)", "タリン(TLL)"];
const CARRIERS = {
  飛行機: ["JAL", "ANA", "Peach", "ジェットスター", "スカイマーク", "ZIPAIR", "チャイナエアライン", "エバー航空", "スターラックス", "タイガーエア台湾", "大韓航空", "アシアナ航空", "チェジュ航空",
    "キャセイパシフィック", "シンガポール航空", "タイ国際航空", "ベトナム航空", "フィリピン航空", "エティハド航空", "エミレーツ航空", "カタール航空", "ターキッシュエアラインズ",
    "フィンエアー", "ルフトハンザ", "ブリティッシュ・エアウェイズ", "エールフランス", "KLM", "ライアンエアー", "イージージェット", "ウィズエアー", "ブエリング", "ハワイアン航空", "ユナイテッド航空", "デルタ航空"],
  鉄道: ["新幹線", "JR在来線特急", "Eurostar", "ICE", "TGV", "レイルジェット", "Trenitalia", "Italo", "Renfe", "SJ", "台湾高鉄", "台湾鉄路", "KTX", "SRT"],
  夜行列車: ["European Sleeper", "ÖBB ナイトジェット", "サンライズ出雲・瀬戸", "Snälltåget"],
  バス: ["FlixBus", "高速バス", "空港リムジンバス", "RegioJet"],
  フェリー: ["Tallink", "Viking Line", "Jadrolinija", "Gozo Channel", "DFDS"],
  夜行フェリー: ["Tallink（Silja Line）", "Viking Line", "DFDS"],
  車: ["レンタカー", "タクシー", "Uber", "送迎"],
};
const CLASSES = {
  飛行機: ["エコノミー", "プレミアムエコノミー", "ビジネス", "ファースト"],
  鉄道: ["指定席", "自由席", "グリーン車", "1等", "2等", "Standard", "Standard Premier"],
  夜行列車: ["座席", "クシェット（簡易寝台）", "寝台", "個室寝台"],
  バス: ["指定席", "自由席"], フェリー: ["座席", "デッキ", "個室"], 夜行フェリー: ["個室（窓なし）", "個室（海側）", "相部屋"], 車: [],
};
const BOOKING_SITES = ["Airbnb", "Booking.com", "Expedia", "Agoda", "Hotels.com", "Trip.com", "楽天トラベル", "じゃらん", "一休.com", "Yahoo!トラベル", "公式サイト", "電話・現地"];
const uniq = (xs) => [...new Set(xs.map(x => String(x || "").trim()).filter(Boolean))];
// 全旅行から、都市・会社・宿の住所などの候補を集める
function buildSuggestions(allTrips) {
  const stays = allTrips.flatMap(t => staysOf(t)), trs = allTrips.flatMap(t => transitsOf(t)), hs = allTrips.flatMap(t => t.hotels || []), ls = allTrips.flatMap(t => t.localTransport || []);
  const places = TZ_WORDS.flatMap(([, w]) => w.split(" ")).filter(w => !/^[A-Z]{3}$/.test(w));
  return {
    cities: uniq([...stays.map(s => splitCity(s.city).main), ...trs.flatMap(x => [x.fromCity, x.toCity]), ...places]),
    usedCarriers: uniq(trs.map(x => String(x.airline || "").replace(/[（(].*$/, "").replace(/\s*[A-Z0-9]{2,}\d+.*$/, ""))),
    sites: uniq([...BOOKING_SITES, ...hs.map(h => h.site)]),
    addresses: uniq([...hs.map(h => h.address), ...ls.map(l => l.address)]),
    descs: uniq(ls.map(l => l.desc)),
  };
}
// 会社名・便名から手段を推測
function guessMode(carrier) {
  const c = String(carrier || "");
  if (!c.trim()) return "";
  for (const [mode, list] of Object.entries(CARRIERS)) if (list.some(n => c.includes(n.replace(/（.*$/, "")))) return mode;
  if (/航空|エア|Air|air|^[A-Z0-9]{2}\s?\d{2,4}\b/.test(c)) return "飛行機";
  if (/新幹線|特急|列車|鉄道|Rail|rail|train|Train/.test(c)) return "鉄道";
  if (/フェリー|ferry|Ferry|ライン|Line/.test(c)) return "フェリー";
  if (/バス|Bus|bus/.test(c)) return "バス";
  return "";
}
// 予定の内容から種類を推測
function guessCategory(desc) {
  const d = String(desc || "");
  if (/ランチ|ディナー|朝食|夕食|昼食|レストラン|カフェ|食堂|ごはん|ご飯|居酒屋|屋台|夜市|バー|小籠包|ラーメン|寿司/.test(d)) return "食事";
  if (/ツアー|tour|Tour|ガイド/.test(d)) return "ツアー";
  if (/入場|チケット|美術館|博物館|博物院|museum|Museum|ミュージアム|コンサート|ライブ|観劇|劇場|テーマパーク|ディズニー|USJ/.test(d)) return "入場券";
  if (/買い物|ショッピング|お土産|市場|モール|アウトレット/.test(d)) return "買い物";
  return "";
}
// 新しい宿の人数の初期値：参加者の人数、なければこの旅行でいちばん多い人数
function guessGuests(t) {
  if ((t.participants || []).length) return t.participants.length;
  const counts = {};
  (t.hotels || []).forEach(h => { const g = Number(h.guests) || 0; if (g > 0) counts[g] = (counts[g] || 0) + 1; });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? Number(best[0]) : 1;
}

// ================= Claude への提案の依頼（アプリ内では検索できないので、知識にもとづく目安） =================
const SUGGEST_NOTE = "Claudeの知識にもとづく目安です。時刻・料金・運行状況は予約前に公式サイトで確認してください。";
function transitSuggestPrompt(t, x) {
  const ppl = x.people || 1;
  return `旅行「${t.name}」の都市間の移動について、現実的な移動手段の候補を2〜3案出してください。JSONだけを返してください。
区間: ${splitCity(x.fromCity).main || "?"} → ${splitCity(x.toCity).main || "?"}
日付: ${x.departDate || "未定"}（${wdOf(x.departDate)}曜日）
人数: ${ppl}人
形式: {"options":[{"mode":"飛行機|鉄道|夜行列車|バス|フェリー|夜行フェリー|車","carrier":"主な会社・列車名（例：Eurostar、ÖBB Nightjet、Ryanair）","summary":"1行の説明","duration_min":所要時間（分、乗り継ぎ込み）,"price_jpy":1人あたりの料金の目安（円、整数）,"frequency":"本数や時間帯の目安（例：1日3本、朝〜夕方）","tip":"予約や乗り方のコツ（短く）","pros":"この案の良い点（短く）"}]}
速さ・安さ・快適さなど、性格の違う案を並べてください。存在しない路線は出さないでください。`;
}
function daySuggestPrompt(t, iso, wish) {
  const { ev, head, sleeping } = dayEvents(t, iso);
  return `旅行「${t.name}」の${md(iso)}（${wdOf(iso)}曜日）の過ごし方を提案してください。JSONだけを返してください。
場所: ${head}${sleeping ? `（${splitCity(sleeping.city).main}に宿泊）` : ""}
すでに決まっている予定: ${ev.length ? ev.map(e => `${e.time || "時刻未定"} ${e.title}`).join(" / ") : "なし"}
人数: ${(t.participants || []).length || 1}人
希望: ${wish || "特になし"}
形式: {"items":[{"time":"HH:MM","end_time":"HH:MM","title":"予定の名前","category":"観光|食事|買い物|ツアー|入場券|その他体験","address":"場所（施設名や地区名）","price_jpy":1人あたりの費用の目安（円、整数、無料なら0）,"needs_booking":事前予約が必要ならtrue,"note":"ひとこと（見どころ・注意点）"}]}
すでに決まっている予定や移動の時刻と重ならないように、3〜6件を時刻順に出してください。移動がある日は無理のない量にしてください。`;
}
function tripDraftPrompt(f) {
  return `次の旅行の日程の下書きを作ってください。JSONだけを返してください。
旅行名: ${f.name}
出発日: ${f.start}（${wdOf(f.start)}曜日）
泊数: ${f.nights}泊
出発地: ${f.home || "関西空港"}
どんな旅行か: ${f.idea}
形式: {"stays":[{"city":"都市名（日本語）","nights":泊数}],"moves":[{"day":何日目（1から）,"from":"出発地","to":"到着地","mode":"飛行機|鉄道|夜行列車|バス|フェリー|車","depart_time":"HH:MM（目安、なければ空）","arrive_time":"HH:MM（目安、なければ空）","carrier":"会社名の例（なければ空）"}],"plans":[{"day":何日目,"time":"HH:MM","title":"予定の名前","category":"観光|食事|買い物|ツアー|入場券|その他体験","address":"場所","note":"ひとこと","needs_booking":true/false}]}
- stays の泊数の合計は ${f.nights} 泊にしてください。
- moves には出発地からの行きと、出発地への帰り、都市間の移動を入れてください。
- plans は1日あたり2〜4件、移動の時間と重ならないようにしてください。`;
}
// 下書きの JSON を旅行データに組み立てる
function applyTripDraft(t, d, start) {
  const stays = [], plans = [];
  let cur = start;
  (Array.isArray(d && d.stays) ? d.stays : []).forEach(s => {
    const n = Math.max(0, Math.round(Number(s.nights) || 0));
    if (!s.city) return;
    stays.push({ id: uid(), type: "stay", city: String(s.city), startDate: cur, nights: n, memo: "", status: "未確定", noHotel: false });
    cur = addDays(cur, Math.max(1, n));
  });
  const dayISO = (n) => addDays(start, Math.max(0, (Number(n) || 1) - 1));
  const moves = (Array.isArray(d && d.moves) ? d.moves : []).filter(m => m.from && m.to).map(m => ({
    id: uid(), type: "transit", mode: MODES.includes(m.mode) ? m.mode : "未定", fromCity: String(m.from), toCity: String(m.to),
    departDate: dayISO(m.day), departTime: /^\d{1,2}:\d{2}$/.test(m.depart_time || "") ? m.depart_time : "", departTZ: 9,
    arriveDate: dayISO(m.day), arriveTime: /^\d{1,2}:\d{2}$/.test(m.arrive_time || "") ? m.arrive_time : "", arriveTZ: 9,
    airline: String(m.carrier || ""), transitStops: "", cls: "", price: 0, people: 1, miles: false, memo: "", status: "候補", paymentStatus: "未払い",
  }));
  (Array.isArray(d && d.plans) ? d.plans : []).forEach(p => {
    if (!p.title) return;
    const date = dayISO(p.day);
    plans.push({ id: uid(), linkedStayId: null, category: LOCAL_CATS.includes(p.category) ? p.category : "観光", desc: String(p.title), address: String(p.address || ""), fromAddress: "", toAddress: "",
      date, startTime: /^\d{1,2}:\d{2}$/.test(p.time || "") ? p.time : "", endTime: "", mode: "", price: 0, people: 1, needsBooking: !!p.needs_booking,
      memo: [p.note, "（Claudeの提案）"].filter(Boolean).join(" "), paymentStatus: "未払い", status: "候補" });
  });
  const itinerary = normalizeItinerary([...stays, ...moves]);
  plans.forEach(l => { const s = stays.find(s => l.date >= s.startDate && l.date < stayEnd(s)); l.linkedStayId = s ? s.id : null; });
  return { ...t, itinerary, localTransport: [...(t.localTransport || []), ...plans] };
}

// ================= 旅のフレーズ集 =================
// タイムゾーン → [国, 言語, 読み上げ用の言語コード]
const ZONE_LANG = {
  "Asia/Taipei": ["台湾", "中国語（繁体字）", "zh-TW"], "Asia/Seoul": ["韓国", "韓国語", "ko-KR"], "Asia/Hong_Kong": ["香港", "広東語", "zh-HK"], "Asia/Macau": ["マカオ", "広東語", "zh-HK"],
  "Asia/Shanghai": ["中国", "中国語（簡体字）", "zh-CN"], "Asia/Bangkok": ["タイ", "タイ語", "th-TH"], "Asia/Singapore": ["シンガポール", "英語", "en-SG"], "Asia/Kuala_Lumpur": ["マレーシア", "マレー語", "ms-MY"],
  "Asia/Ho_Chi_Minh": ["ベトナム", "ベトナム語", "vi-VN"], "Asia/Manila": ["フィリピン", "英語", "en-PH"], "Asia/Makassar": ["インドネシア", "インドネシア語", "id-ID"], "Asia/Jakarta": ["インドネシア", "インドネシア語", "id-ID"],
  "Asia/Kolkata": ["インド", "英語", "en-IN"], "Asia/Dubai": ["UAE", "英語", "en-US"], "Asia/Qatar": ["カタール", "英語", "en-US"], "Europe/Istanbul": ["トルコ", "トルコ語", "tr-TR"],
  "Pacific/Honolulu": ["アメリカ（ハワイ）", "英語", "en-US"], "Pacific/Guam": ["グアム", "英語", "en-US"], "Pacific/Saipan": ["サイパン", "英語", "en-US"], "America/Los_Angeles": ["アメリカ", "英語", "en-US"],
  "America/New_York": ["アメリカ", "英語", "en-US"], "America/Vancouver": ["カナダ", "英語", "en-CA"], "Australia/Sydney": ["オーストラリア", "英語", "en-AU"],
  "Europe/London": ["イギリス", "英語", "en-GB"], "Europe/Dublin": ["アイルランド", "英語", "en-IE"], "Europe/Lisbon": ["ポルトガル", "ポルトガル語", "pt-PT"], "Europe/Paris": ["フランス", "フランス語", "fr-FR"],
  "Europe/Brussels": ["ベルギー", "フランス語", "fr-BE"], "Europe/Amsterdam": ["オランダ", "オランダ語", "nl-NL"], "Europe/Luxembourg": ["ルクセンブルク", "フランス語", "fr-FR"], "Europe/Berlin": ["ドイツ", "ドイツ語", "de-DE"],
  "Europe/Zurich": ["スイス", "ドイツ語", "de-CH"], "Europe/Vienna": ["オーストリア", "ドイツ語", "de-AT"], "Europe/Prague": ["チェコ", "チェコ語", "cs-CZ"], "Europe/Bratislava": ["スロバキア", "スロバキア語", "sk-SK"],
  "Europe/Budapest": ["ハンガリー", "ハンガリー語", "hu-HU"], "Europe/Warsaw": ["ポーランド", "ポーランド語", "pl-PL"], "Europe/Copenhagen": ["デンマーク", "デンマーク語", "da-DK"], "Europe/Stockholm": ["スウェーデン", "スウェーデン語", "sv-SE"],
  "Europe/Oslo": ["ノルウェー", "ノルウェー語", "nb-NO"], "Europe/Helsinki": ["フィンランド", "フィンランド語", "fi-FI"], "Europe/Tallinn": ["エストニア", "エストニア語", "et-EE"], "Europe/Riga": ["ラトビア", "ラトビア語", "lv-LV"],
  "Europe/Vilnius": ["リトアニア", "リトアニア語", "lt-LT"], "Europe/Madrid": ["スペイン", "スペイン語", "es-ES"], "Europe/Rome": ["イタリア", "イタリア語", "it-IT"], "Europe/Zagreb": ["クロアチア", "クロアチア語", "hr-HR"],
  "Europe/Ljubljana": ["スロベニア", "スロベニア語", "sl-SI"], "Europe/Athens": ["ギリシャ", "ギリシャ語", "el-GR"], "Europe/Malta": ["マルタ", "英語", "en-MT"],
};
// 旅行先の言語（訪れる順、同じ言語はまとめる）。日本は除く
function tripLanguages(t) {
  const out = [];
  sortItinerary(staysOf(t)).forEach(s => {
    const m = tzMatch(s.city); if (!m || m.zone === "Asia/Tokyo") return;
    const z = ZONE_LANG[m.zone]; if (!z || SKIP_LANGS.has(z[1])) return;
    const ex = out.find(o => o.lang === z[1]);
    if (ex) { if (!ex.countries.includes(z[0])) ex.countries.push(z[0]); }
    else out.push({ lang: z[1], bcp: z[2], countries: [z[0]] });
  });
  return out;
}
// 収録するフレーズ（2つの記事に載っていたものを合わせたもの）。「○○」は自分で単語を入れて使う
const PHRASE_SET = [
  ["いちばん大事", ["すみません", "ありがとうございます", "はい", "いいえ", "わかりません", "英語が話せますか？"]],
  ["あいさつ", ["おはようございます", "こんにちは", "こんばんは", "おやすみなさい", "はじめまして", "よろしくお願いします", "元気ですか？", "あなたはどうですか？"]],
  ["会話", ["お名前はなんですか？", "出身はどこですか？", "どこに住んでいますか？", "お仕事は何をしていますか？", "趣味はなんですか？", "○○語を話しますか？", "なぜ○○語を勉強していますか？", "なぜなら○○だからです", "どのくらい○○を学んでいますか？", "○○したことはありますか？", "○○が好きですか？", "○○はどういう意味ですか？", "そうですね", "なるほど", "ちょっと…（遠回しに断る）"]],
  ["お願い・確認", ["もう一度言ってください", "ゆっくり話してください", "ちょっと待ってください", "○○してもいいですか？", "○○していただけますか？", "○○ができますか？", "○○がありますか？", "いつ○○しましたか？", "何時ですか？", "あの方はどなたですか？"]],
  ["移動・道案内", ["○○はどこですか？", "○○に行きたいです", "○○まではどうやって行きますか？", "○○までお願いします（タクシーで）", "ここでいいです（降ります）", "どの○○ですか？", "左", "右", "まっすぐ"]],
  ["レストラン", ["これをひとつ", "これをください", "なにがおすすめですか？", "おいしいです", "お会計お願いします", "ベジタリアンです", "肉なしでお願いします", "アレルギーがあります"]],
  ["買い物", ["いくらですか？", "安くなりますか？", "これを見せてください", "ちょっと小さいです", "ちょっと大きいです", "クレジットカードは使えますか？"]],
  ["困ったとき", ["助けて！", "病院はどこですか？"]],
  ["よく聞く言葉", ["いらっしゃいませ（お店で言われる言葉）"]],
  ["数字", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]],
];
// しおりの表の基準の列に使う英語（「___」は自分で単語を入れる所）
const PHRASE_EN = {
  "すみません": "Excuse me", "ありがとうございます": "Thank you", "はい": "Yes", "いいえ": "No", "わかりません": "I don't understand", "英語が話せますか？": "Do you speak English?",
  "おはようございます": "Good morning", "こんにちは": "Hello", "こんばんは": "Good evening", "おやすみなさい": "Good night", "はじめまして": "Nice to meet you", "よろしくお願いします": "Pleased to meet you",
  "元気ですか？": "How are you?", "あなたはどうですか？": "And you?", "お名前はなんですか？": "What's your name?", "出身はどこですか？": "Where are you from?", "どこに住んでいますか？": "Where do you live?",
  "お仕事は何をしていますか？": "What do you do?", "趣味はなんですか？": "What are your hobbies?", "○○語を話しますか？": "Do you speak ___?", "なぜ○○語を勉強していますか？": "Why are you learning ___?",
  "なぜなら○○だからです": "Because ___", "どのくらい○○を学んでいますか？": "How long have you studied ___?", "○○したことはありますか？": "Have you ever ___?", "○○が好きですか？": "Do you like ___?",
  "○○はどういう意味ですか？": "What does ___ mean?", "そうですね": "I see / That's right", "なるほど": "I see", "ちょっと…（遠回しに断る）": "Well... (polite no)",
  "もう一度言ってください": "Could you say that again?", "ゆっくり話してください": "Please speak slowly", "ちょっと待ってください": "Just a moment, please", "○○してもいいですか？": "May I ___?",
  "○○していただけますか？": "Could you ___?", "○○ができますか？": "Can you ___?", "○○がありますか？": "Do you have ___?", "いつ○○しましたか？": "When did you ___?", "何時ですか？": "What time is it?",
  "あの方はどなたですか？": "Who is that?", "○○はどこですか？": "Where is ___?", "○○に行きたいです": "I want to go to ___", "○○まではどうやって行きますか？": "How do I get to ___?",
  "○○までお願いします（タクシーで）": "To ___, please (taxi)", "ここでいいです（降ります）": "Here is fine, thanks", "どの○○ですか？": "Which ___?", "左": "Left", "右": "Right", "まっすぐ": "Straight ahead",
  "これをひとつ": "One of these", "これをください": "This one, please", "なにがおすすめですか？": "What do you recommend?", "おいしいです": "It's delicious", "お会計お願いします": "The bill, please",
  "ベジタリアンです": "I'm vegetarian", "肉なしでお願いします": "No meat, please", "アレルギーがあります": "I have an allergy", "いくらですか？": "How much is it?", "安くなりますか？": "Can you give me a discount?",
  "これを見せてください": "Can I see this?", "ちょっと小さいです": "It's a bit small", "ちょっと大きいです": "It's a bit big", "クレジットカードは使えますか？": "Do you take credit cards?",
  "助けて！": "Help!", "病院はどこですか？": "Where is the hospital?", "いらっしゃいませ（お店で言われる言葉）": "Welcome (said by shop staff)",
};
// 英語はわかるので、英語のフレーズ集は作らない・しおりにも入れない
const SKIP_LANGS = new Set(FEATURES.skipLangs || []);
const PHRASE_CATS = PHRASE_SET.map(c => c[0]);
// しおりに載せる主要なフレーズ（旅行中に実際によく使うもの）
const PHRASE_ESSENTIAL = new Set(["すみません", "ありがとうございます", "はい", "いいえ", "わかりません", "英語が話せますか？", "こんにちは", "おはようございます", "こんばんは",
  "もう一度言ってください", "ゆっくり話してください", "ちょっと待ってください", "○○はどこですか？", "○○に行きたいです", "○○までお願いします（タクシーで）", "ここでいいです（降ります）",
  "これをください", "なにがおすすめですか？", "おいしいです", "お会計お願いします", "アレルギーがあります", "いくらですか？", "クレジットカードは使えますか？", "これを見せてください",
  "助けて！", "病院はどこですか？", "左", "右", "まっすぐ"]);
const PHRASE_LIST = PHRASE_SET.flatMap(([cat, list]) => list.map(ja => ({ cat, ja })));
function phrasePrompt(lang, countries) {
  return `${countries.join("・")}を旅行する日本人のために、次の日本語のフレーズを${lang}に訳してください。JSONだけを返してください。
形式: {"items":[{"id":番号,"local":"${lang}の表現（現地の文字で）","reading":"カタカナでの読み方（現地の発音に近く）"}]}
- 番号は下の一覧の番号です。すべての番号について返してください。
- 「○○」はそのまま「○○」として残してください（旅行者があとで単語を入れて使います）。
- 現地で自然に通じる、旅行者向けの短い言い方にしてください。（ ）内は説明なので訳さないでください。
- 「いらっしゃいませ」は、お店で店員が客に言う決まり文句を訳してください。数字は数え方の言葉（例：one, two）にしてください。

${PHRASE_LIST.map((p, i) => `${i + 1}. ${p.ja}`).join("\n")}`;
}

// ================= 国・通貨 =================
const ZONE_CUR = {
  "Asia/Taipei": "TWD", "Asia/Seoul": "KRW", "Asia/Hong_Kong": "HKD", "Asia/Macau": "MOP", "Asia/Shanghai": "CNY", "Asia/Bangkok": "THB", "Asia/Singapore": "SGD", "Asia/Kuala_Lumpur": "MYR",
  "Asia/Ho_Chi_Minh": "VND", "Asia/Manila": "PHP", "Asia/Makassar": "IDR", "Asia/Jakarta": "IDR", "Asia/Kolkata": "INR", "Asia/Dubai": "AED", "Asia/Qatar": "QAR", "Europe/Istanbul": "TRY",
  "Pacific/Honolulu": "USD", "Pacific/Guam": "USD", "Pacific/Saipan": "USD", "America/Los_Angeles": "USD", "America/New_York": "USD", "America/Vancouver": "CAD", "Australia/Sydney": "AUD",
  "Europe/London": "GBP", "Europe/Zurich": "CHF", "Europe/Prague": "CZK", "Europe/Budapest": "HUF", "Europe/Warsaw": "PLN", "Europe/Copenhagen": "DKK", "Europe/Stockholm": "SEK", "Europe/Oslo": "NOK",
};
const CUR_NAME = { JPY: "円", EUR: "ユーロ", USD: "米ドル", GBP: "英ポンド", CHF: "スイスフラン", CZK: "チェココルナ", HUF: "フォリント", PLN: "ズウォティ", DKK: "デンマーククローネ", SEK: "スウェーデンクローナ",
  NOK: "ノルウェークローネ", KRW: "ウォン", TWD: "台湾ドル", HKD: "香港ドル", MOP: "パタカ", CNY: "人民元", THB: "バーツ", SGD: "シンガポールドル", MYR: "リンギット", VND: "ドン", PHP: "フィリピンペソ",
  IDR: "ルピア", INR: "インドルピー", AED: "ディルハム", QAR: "カタールリヤル", TRY: "トルコリラ", CAD: "カナダドル", AUD: "豪ドル" };
// 訪れる国（日本以外）。最初に入る日付つき
function tripCountries(t) {
  const out = [];
  sortItinerary(staysOf(t)).forEach(s => {
    const m = tzMatch(s.city); if (!m || m.zone === "Asia/Tokyo") return;
    const z = ZONE_LANG[m.zone]; if (!z) return;
    if (!out.some(o => o.country === z[0])) out.push({ country: z[0], zone: m.zone, first: s.startDate, cities: [] });
    const o = out.find(o => o.country === z[0]); const c = splitCity(s.city).main; if (!o.cities.includes(c)) o.cities.push(c);
  });
  return out;
}
function tripCurrencies(t) {
  return uniq([...tripCountries(t).map(c => ZONE_CUR[c.zone] || "EUR"), ...Object.keys(t.rates || {}), ...(t.expenses || []).map(e => e.currency)]).filter(c => c && c !== "JPY");
}
const toJPY = (t, amount, cur) => cur === "JPY" || !cur ? Number(amount) || 0 : (Number(amount) || 0) * (Number((t.rates || {})[cur]) || 0);
const hasRate = (t, cur) => cur === "JPY" || Number((t.rates || {})[cur]) > 0;
function ratesPrompt(codes) {
  return `次の通貨の、日本円に対するおおよその為替レート（1単位あたり何円か）を、JSONだけで返してください。あなたの知識の範囲で最近の目安で構いません。
形式: {"as_of":"YYYY-MM（目安の時期）","rates":{"EUR":165.2}}
通貨: ${codes.join(", ")}`;
}

// ================= 出発前の手続き =================
function entryPrompt(t) {
  const cs = tripCountries(t), trs = transitsOf(t).filter(x => x.mode === "飛行機");
  return `日本国籍（日本のパスポート）の旅行者が、次の旅行をするときに出発前に必要な手続き・準備を、国ごとに洗い出してください。JSONだけを返してください。
旅行: ${t.name}
訪れる国（最初に入る日・都市）: ${cs.map(c => `${c.country}（${c.first}・${c.cities.join("、")}）`).join(" / ")}
飛行機の区間: ${trs.map(x => `${splitCity(x.fromCity).main}→${splitCity(x.toCity).main}（${x.departDate}${x.airline ? "・" + x.airline : ""}）`).join(" / ") || "未定"}
形式: {"items":[{"country":"国名（全体に関わるものは「全体」）","title":"手続き名（例：ETIAS（欧州渡航情報認証制度）の申請）","detail":"内容・注意点（1〜2文）","apply_by":"YYYY-MM-DD（この日までに済ませたい目安。なければ空）","url":"公式サイトのURL（確かなものだけ。なければ空）","required":true}]}
- ビザ・電子渡航認証（ETIAS、K-ETA、ESTAなど）、パスポートの残存期間、入国カード・オンライン申告、乗り継ぎ国の要件、海外旅行保険、その他必要なもの。
- 制度の開始時期や免除の有無が不確かなものは detail にその旨を書いてください。
- 不要なものは入れないでください。`;
}

// ================= 緊急時の情報 =================
function emergencyPrompt(t) {
  return `次の国を旅行する日本人向けに、緊急時の連絡先を国ごとにまとめてください。JSONだけを返してください。
国: ${tripCountries(t).map(c => `${c.country}（${c.cities.join("、")}）`).join(" / ")}
形式: {"countries":[{"country":"国名","general":"共通の緊急番号（例：112）","police":"警察","ambulance":"救急","fire":"消防","embassy":{"name":"在○○日本国大使館","address":"住所","phone":"電話番号（国番号から）"},"note":"ひとこと（日本語が通じる窓口など）"}]}
不確かな番号は空にしてください。`;
}

// ================= 支出と精算 =================
const EXP_CATS = ["食事", "交通", "観光", "買い物", "宿", "その他"];
// 実際の支払いから、誰が誰にいくら払えばよいか（円換算）
function expenseSettlement(t) {
  const people = t.participants || [];
  const bal = Object.fromEntries(people.map(p => [p, 0]));
  (t.expenses || []).forEach(e => {
    const yen = toJPY(t, e.amount, e.currency);
    const among = (e.split && e.split.length ? e.split : people).filter(p => people.includes(p));
    if (!yen || !among.length || !people.includes(e.payer)) return;
    bal[e.payer] += yen;
    among.forEach(p => { bal[p] -= yen / among.length; });
  });
  const debt = Object.entries(bal).filter(([, v]) => v < -0.5).map(([p, v]) => [p, -v]).sort((a, b) => b[1] - a[1]);
  const cred = Object.entries(bal).filter(([, v]) => v > 0.5).sort((a, b) => b[1] - a[1]);
  const moves = [];
  let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const x = Math.min(debt[i][1], cred[j][1]);
    moves.push({ from: debt[i][0], to: cred[j][0], amount: Math.round(x) });
    debt[i][1] -= x; cred[j][1] -= x;
    if (debt[i][1] < 0.5) i++; if (cred[j][1] < 0.5) j++;
  }
  return { bal, moves };
}
