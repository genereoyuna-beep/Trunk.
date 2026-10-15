// ================= ルートマップ（世界地図をページ内で描く。外部の地図は使わない） =================
// 主な場所の位置 [名前の一部, 緯度, 経度]。3文字の空港コードは「(KIX)」の形でも一致する
const GEO = [
  ["関西空港", 34.43, 135.23], ["KIX", 34.43, 135.23], ["伊丹", 34.79, 135.44], ["ITM", 34.79, 135.44], ["大阪", 34.69, 135.5], ["京都", 35.01, 135.77], ["神戸", 34.69, 135.2],
  ["成田", 35.77, 140.39], ["NRT", 35.77, 140.39], ["羽田", 35.55, 139.78], ["HND", 35.55, 139.78], ["東京", 35.68, 139.76], ["中部国際", 34.86, 136.81], ["セントレア", 34.86, 136.81], ["NGO", 34.86, 136.81],
  ["名古屋", 35.18, 136.91], ["福岡", 33.59, 130.4], ["FUK", 33.59, 130.45], ["新千歳", 42.78, 141.69], ["CTS", 42.78, 141.69], ["札幌", 43.06, 141.35], ["那覇", 26.21, 127.68], ["OKA", 26.2, 127.65], ["沖縄", 26.21, 127.68],
  ["広島", 34.39, 132.46], ["仙台", 38.27, 140.87], ["金沢", 36.56, 136.66], ["箱根", 35.23, 139.11], ["奈良", 34.69, 135.8], ["横浜", 35.44, 139.64], ["長崎", 32.75, 129.88], ["鹿児島", 31.6, 130.56], ["函館", 41.77, 140.73],
  ["台北", 25.03, 121.56], ["桃園", 25.08, 121.23], ["TPE", 25.08, 121.23], ["松山空港", 25.07, 121.55], ["TSA", 25.07, 121.55], ["高雄", 22.63, 120.3], ["KHH", 22.58, 120.35], ["台中", 24.15, 120.67], ["台南", 22.99, 120.21], ["花蓮", 23.99, 121.6], ["九份", 25.11, 121.84],
  ["ソウル", 37.57, 126.98], ["仁川", 37.46, 126.44], ["ICN", 37.46, 126.44], ["金浦", 37.56, 126.8], ["GMP", 37.56, 126.8], ["釜山", 35.18, 129.08], ["PUS", 35.18, 128.94], ["済州", 33.5, 126.53],
  ["香港", 22.32, 114.17], ["HKG", 22.31, 113.92], ["マカオ", 22.2, 113.55], ["上海", 31.23, 121.47], ["PVG", 31.14, 121.81], ["北京", 39.9, 116.4], ["バンコク", 13.76, 100.5], ["BKK", 13.69, 100.75], ["プーケット", 7.88, 98.39], ["チェンマイ", 18.79, 98.98],
  ["シンガポール", 1.35, 103.82], ["SIN", 1.36, 103.99], ["クアラルンプール", 3.14, 101.69], ["ホーチミン", 10.82, 106.63], ["ハノイ", 21.03, 105.85], ["ダナン", 16.05, 108.2], ["マニラ", 14.6, 120.98], ["セブ", 10.32, 123.89], ["バリ", -8.65, 115.22], ["ジャカルタ", -6.21, 106.85],
  ["デリー", 28.61, 77.21], ["ドバイ", 25.2, 55.27], ["DXB", 25.25, 55.36], ["アブダビ", 24.45, 54.38], ["AUH", 24.43, 54.65], ["ドーハ", 25.29, 51.53], ["DOH", 25.27, 51.61], ["イスタンブール", 41.01, 28.98], ["IST", 41.26, 28.74],
  ["ホノルル", 21.31, -157.86], ["ハワイ", 21.31, -157.86], ["HNL", 21.32, -157.92], ["グアム", 13.44, 144.79], ["サイパン", 15.18, 145.75], ["ロサンゼルス", 34.05, -118.24], ["LAX", 33.94, -118.41], ["サンフランシスコ", 37.77, -122.42],
  ["ラスベガス", 36.17, -115.14], ["シアトル", 47.61, -122.33], ["ニューヨーク", 40.71, -74.01], ["バンクーバー", 49.28, -123.12], ["シドニー", -33.87, 151.21], ["メルボルン", -37.81, 144.96],
  ["ロンドン", 51.51, -0.13], ["LHR", 51.47, -0.45], ["ヒースロー", 51.47, -0.45], ["エディンバラ", 55.95, -3.19], ["マンチェスター", 53.48, -2.24], ["ダブリン", 53.35, -6.26], ["リスボン", 38.72, -9.14], ["ポルト", 41.15, -8.61],
  ["パリ", 48.86, 2.35], ["CDG", 49.01, 2.55], ["ニース", 43.7, 7.27], ["リヨン", 45.76, 4.84], ["ブリュッセル", 50.85, 4.35], ["ブルージュ", 51.21, 3.22], ["アムステルダム", 52.37, 4.9], ["AMS", 52.31, 4.76], ["ルクセンブルク", 49.61, 6.13],
  ["ベルリン", 52.52, 13.4], ["ミュンヘン", 48.14, 11.58], ["MUC", 48.35, 11.79], ["フランクフルト", 50.11, 8.68], ["FRA", 50.04, 8.56], ["ハンブルク", 53.55, 9.99], ["ケルン", 50.94, 6.96], ["チューリッヒ", 47.38, 8.54], ["ジュネーブ", 46.2, 6.14], ["インターラーケン", 46.69, 7.86],
  ["ウィーン", 48.21, 16.37], ["VIE", 48.11, 16.57], ["ザルツブルク", 47.81, 13.04], ["プラハ", 50.08, 14.44], ["PRG", 50.1, 14.26], ["チェスキー", 48.81, 14.32], ["ブラチスラヴァ", 48.15, 17.11], ["ブラチスラバ", 48.15, 17.11], ["ブダペスト", 47.5, 19.04], ["BUD", 47.44, 19.26],
  ["ワルシャワ", 52.23, 21.01], ["WAW", 52.17, 20.97], ["クラクフ", 50.06, 19.94], ["KRK", 50.08, 19.78], ["コペンハーゲン", 55.68, 12.57], ["CPH", 55.62, 12.65], ["ストックホルム", 59.33, 18.07], ["ARN", 59.65, 17.92], ["ヨンショーピング", 57.78, 14.16], ["ヨーテボリ", 57.71, 11.97],
  ["オスロ", 59.91, 10.75], ["ヘルシンキ", 60.17, 24.94], ["HEL", 60.32, 24.96], ["タリン", 59.44, 24.75], ["TLL", 59.41, 24.83], ["リガ", 56.95, 24.11], ["ビリニュス", 54.69, 25.28],
  ["マドリード", 40.42, -3.7], ["バルセロナ", 41.39, 2.17], ["BCN", 41.3, 2.08], ["セビリア", 37.39, -5.98], ["ローマ", 41.9, 12.5], ["FCO", 41.8, 12.25], ["ミラノ", 45.46, 9.19], ["ヴェネチア", 45.44, 12.32], ["ベネチア", 45.44, 12.32], ["フィレンツェ", 43.77, 11.26], ["ナポリ", 40.85, 14.27],
  ["ザグレブ", 45.81, 15.98], ["スプリット", 43.51, 16.44], ["SPU", 43.54, 16.3], ["ドゥブロヴニク", 42.65, 18.09], ["ドブロブニク", 42.65, 18.09], ["リュブリャナ", 46.06, 14.51], ["アテネ", 37.98, 23.73], ["ATH", 37.94, 23.94], ["サントリーニ", 36.39, 25.46],
  ["スリーマ", 35.91, 14.5], ["バレッタ", 35.9, 14.51], ["ゴゾ", 36.04, 14.24], ["マルタ", 35.9, 14.45], ["MLA", 35.86, 14.48],
].sort((a, b) => b[0].length - a[0].length);
// 名前から位置。旅行に保存した位置（Claude が推測したもの）→ 「(XXX)」の空港コード → 名前の一部、の順に探す
function geoFor(name, saved) {
  const n = String(name || "").trim();
  if (!n) return null;
  if (saved && saved[n]) return saved[n];
  const code = n.match(/\(([A-Z]{3})\)/);
  const byCode = code && GEO.find(g => g[0] === code[1]);
  if (byCode) return [byCode[1], byCode[2]];
  const hit = GEO.find(g => /^[A-Z]{3}$/.test(g[0]) ? new RegExp(`(^|[^A-Za-z])${g[0]}([^A-Za-z]|$)`).test(n) : n.includes(g[0]));
  return hit ? [hit[1], hit[2]] : null;
}
// 位置が分からない地名（Claude に推測を頼む対象）
function unknownPlaces(t) {
  const names = [...staysOf(t).map(s => s.city), ...transitsOf(t).filter(isLeg).flatMap(x => [x.fromCity, x.toCity])].filter(Boolean);
  return uniq(names).filter(n => !geoFor(n, t.geo));
}
function geoPrompt(names) {
  return `次の地名の緯度・経度を推測して、JSONだけを返してください。分からないものは入れないでください。
形式: {"地名": [緯度, 経度], ...}（小数点以下2桁程度）
地名: ${JSON.stringify(names)}`;
}

let WORLD_POLYS = null;
function worldPolys() {
  if (WORLD_POLYS) return WORLD_POLYS;
  WORLD_POLYS = WORLD_DATA.split(";").map(r => {
    const a = r.split(",").map(Number), pts = [];
    let x = a[0], y = a[1], minX = x, maxX = x, minY = y, maxY = y; pts.push(x / 10, y / 10);
    for (let i = 2; i < a.length; i += 2) { x += a[i]; y += a[i + 1]; pts.push(x / 10, y / 10); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    return { pts, box: [minX / 10, minY / 10, maxX / 10, maxY / 10] };
  });
  return WORLD_POLYS;
}
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-80, Math.min(80, lat)) * Math.PI) / 360)) * 180 / Math.PI;

// 旅程からルートの点と線を作る
function routeOf(t) {
  const sorted = sortItinerary(t.itinerary || []);
  const stops = [], segs = [];
  let prev = null, n = 0;
  const keyOf = (ll) => ll[0].toFixed(2) + "," + ll[1].toFixed(2);
  const stopAt = (ll, label, extra) => {
    const k = keyOf(ll);
    // 同じ場所、または近く（空港と市内など、約80km以内）の点は1つにまとめる
    let s = stops.find(x => x.k === k) || stops.find(x => (!extra || !x.stays.length) && Math.abs(x.ll[0] - ll[0]) < 0.7 && Math.abs(x.ll[1] - ll[1]) < 0.9);
    if (!s) { s = { k, ll, label, nums: [], stays: [] }; stops.push(s); }
    else if (extra && !s.stays.length) { s.ll = ll; s.k = k; s.label = label; } // 滞在先の位置と名前を優先
    if (extra) { s.nums.push(++n); s.stays.push(extra); }
    return s;
  };
  sorted.forEach(r => {
    if (r.type === "transit" && !isLeg(r)) {
      // 街の中の移動や日帰りは、両端の位置が分かって離れているときだけ線を引く（骨組みのつながりは変えない）
      const a = geoFor(r.fromCity, t.geo), b = geoFor(r.toCity, t.geo);
      if (a && b && keyOf(a) !== keyOf(b) && (Math.abs(a[0] - b[0]) > 0.15 || Math.abs(a[1] - b[1]) > 0.2)) {
        const sa = stopAt(a, splitCity(r.fromCity).main), sb = stopAt(b, splitCity(r.toCity).main);
        if (sa !== sb) segs.push({ a: sa, b: sb, mode: r.mode || "未定", st: transitState(r), id: r.id });
      }
    } else if (r.type === "transit") {
      const a = geoFor(r.fromCity, t.geo) || (prev && prev.ll), b = geoFor(r.toCity, t.geo);
      if (a && b) {
        const sa = stopAt(a, splitCity(r.fromCity).main.replace(/\s*\([A-Z]{3}\)$/, "")), sb = stopAt(b, splitCity(r.toCity).main.replace(/\s*\([A-Z]{3}\)$/, ""));
        segs.push({ a: sa, b: sb, mode: r.mode || "未定", st: transitState(r), id: r.id }); prev = sb;
      }
    } else if (r.city) {
      const ll = geoFor(r.city, t.geo);
      if (!ll) return;
      const s = stopAt(ll, stayShort(r), r);
      if (prev && prev !== s && !segs.some(g => g.b === s && g.a === prev)) segs.push({ a: prev, b: s, mode: "未定", st: ST.unknown });
      prev = s;
    }
  });
  return { stops, segs };
}

function RouteMap({ t, width = 640, height = 440, onPick, compact }) {
  const { stops, segs } = useMemo(() => routeOf(t), [t]);
  const clipId = useRef("mc" + Math.random().toString(36).slice(2)).current;
  const stayStops = stops.filter(s => s.stays.length);
  const focus = stayStops.length ? stayStops : stops;
  if (!focus.length) return <p className="empty">位置の分かる場所がまだありません。</p>;
  // 表示範囲：滞在先がすべて入るように（日本からの往復便など遠い点ははみ出させ、端に矢印で示す）
  let x0 = Math.min(...focus.map(s => s.ll[1])), x1 = Math.max(...focus.map(s => s.ll[1]));
  let y0 = Math.min(...focus.map(s => mercY(s.ll[0]))), y1 = Math.max(...focus.map(s => mercY(s.ll[0])));
  const minSpan = 3.2;
  if (x1 - x0 < minSpan) { const c = (x0 + x1) / 2; x0 = c - minSpan / 2; x1 = c + minSpan / 2; }
  if (y1 - y0 < minSpan * 0.7) { const c = (y0 + y1) / 2; y0 = c - minSpan * 0.35; y1 = c + minSpan * 0.35; }
  const padX = (x1 - x0) * 0.14 + 0.3, padY = (y1 - y0) * 0.16 + 0.3;
  x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
  const k = Math.min(width / (x1 - x0), height / (y1 - y0));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const P = (lat, lng) => [width / 2 + (lng - cx) * k, height / 2 - (mercY(lat) - cy) * k];
  const vb = [cx - width / 2 / k, cx + width / 2 / k];
  const latTop = (2 * Math.atan(Math.exp((cy + height / 2 / k) * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI;
  const latBot = (2 * Math.atan(Math.exp((cy - height / 2 / k) * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI;
  const land = (() => worldPolys().filter(p => p.box[2] >= vb[0] - 1 && p.box[0] <= vb[1] + 1 && p.box[3] >= latBot - 1 && p.box[1] <= latTop + 1).map(p => {
    let d = "";
    for (let i = 0; i < p.pts.length; i += 2) { const [x, y] = P(p.pts[i + 1], p.pts[i]); d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }
    return d + "Z";
  }))();
  const inside = ([x, y]) => x >= 0 && x <= width && y >= 0 && y <= height;
  // 画面外へ向かう線は、端との交点に行き先の名前を出す
  const edgePoint = (p, q) => {
    let tmin = 0, tmax = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
    for (const [pp, qq] of [[-dx, p[0]], [dx, width - p[0]], [-dy, p[1]], [dy, height - p[1]]]) {
      if (pp === 0) continue; const r = qq / pp;
      if (pp < 0) tmin = Math.max(tmin, r); else tmax = Math.min(tmax, r);
    }
    return [p[0] + dx * tmax, p[1] + dy * tmax];
  };
  const MODE_STYLE = { "飛行機": "2 5", "鉄道": "", "夜行列車": "", "バス": "6 3", "フェリー": "8 4 2 4", "夜行フェリー": "8 4 2 4", "車": "6 3" };
  const offEdge = [];
  const lines = segs.map((g, i) => {
    const a = P(g.a.ll[0], g.a.ll[1]), b = P(g.b.ll[0], g.b.ll[1]);
    const curve = g.mode === "飛行機";
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const c = curve ? [mx - (b[1] - a[1]) * 0.18, my + (b[0] - a[0]) * 0.18] : null;
    if (!inside(a) || !inside(b)) {
      const inPt = inside(a) ? a : b, outPt = inside(a) ? b : a, outStop = inside(a) ? g.b : g.a;
      if (inside(inPt)) offEdge.push({ p: edgePoint(inPt, outPt), label: outStop.label, dir: inside(a) ? "to" : "from" });
    }
    const unknown = g.st.key === "unknown";
    return <path key={i} d={curve ? `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}` : `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} fill="none"
      stroke={unknown ? "#8A929A" : "#15202B"} strokeWidth={len > 4 ? 1.6 : 1} strokeDasharray={unknown ? "1 4" : MODE_STYLE[g.mode] || ""} strokeLinecap="round" />;
  });
  const fs = compact ? 10 : 11;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", maxWidth: width, background: "#F7F8F5", borderRadius: compact ? 0 : 12 }} role="img" aria-label={`${t.name}のルートマップ`}>
      <defs><clipPath id={clipId}><rect width={width} height={height} rx={compact ? 0 : 12} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
        {land.map((d, i) => <path key={i} d={d} fill="#E4E6E1" stroke="#C9CDC6" strokeWidth="0.6" />)}
        {lines}
        {Object.values(offEdge.reduce((m, o) => { const e = m[o.label]; m[o.label] = e ? { ...e, both: e.both || e.dir !== o.dir } : o; return m; }, {})).map((o, i) => {
          const tx = Math.max(56, Math.min(width - 56, o.p[0])), ty = Math.max(14, Math.min(height - 8, o.p[1]));
          return <text key={"e" + i} x={tx} y={ty} textAnchor="middle" fontSize={fs - 1} fill="#5A6470" fontFamily="Noto Sans JP, sans-serif" stroke="#F7F8F5" strokeWidth="3" paintOrder="stroke">{o.both ? "⇄ " : o.dir === "to" ? "→ " : "← "}{o.label}</text>;
        })}
        {(() => {
          const vis = stops.filter(s => inside(P(s.ll[0], s.ll[1])));
          const boxes = vis.map(s => { const [x, y] = P(s.ll[0], s.ll[1]); const r = s.stays.length ? 8 : 4; return [x - r, y - r, x + r, y + r]; });
          const hit = (b) => boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]) || b[0] < 2 || b[2] > width - 2 || b[1] < 2 || b[3] > height - 2;
          vis.sort((a, b) => b.stays.length - a.stays.length).forEach(s => {
            const [x, y] = P(s.ll[0], s.ll[1]), r = s.stays.length ? 8 : 4;
            const text = s.label + (s.nums.length > 1 ? `（${s.nums.join("・")}）` : "");
            const w = [...text].reduce((a, ch) => a + (/[\x00-\x7f]/.test(ch) ? 0.6 : 1), 0) * fs + 2, h = fs + 3;
            const cand = [[x + r + 4, y - h / 2, "start"], [x - r - 4 - w, y - h / 2, "end"], [x - w / 2, y - r - 3 - h, "middle"], [x - w / 2, y + r + 3, "middle"],
              [x + r + 2, y - r - h, "start"], [x + r + 2, y + r, "start"], [x - r - 2 - w, y - r - h, "end"], [x - r - 2 - w, y + r, "end"]];
            const pick = cand.find(([bx, by]) => !hit([bx, by, bx + w, by + h])) || cand[0];
            boxes.push([pick[0], pick[1], pick[0] + w, pick[1] + h]);
            s._lab = { text, anchor: pick[2], x: pick[2] === "start" ? pick[0] : pick[2] === "end" ? pick[0] + w : pick[0] + w / 2, y: pick[1] + h - 3.5 };
          });
          return null;
        })()}
        {stops.filter(s => inside(P(s.ll[0], s.ll[1]))).map((s, i) => {
          const [x, y] = P(s.ll[0], s.ll[1]);
          const st = s.stays.length ? stayState(t, s.stays[0]) : null;
          const fill = !st ? "#fff" : st.tone === "open" ? "#FDEBD3" : st.tone === "none" ? "#E4E6E1" : "#1D4ED8";
          const stroke = !st ? "#15202B" : st.tone === "open" ? "#B45309" : st.tone === "none" ? "#5A6470" : "#1D4ED8";
          const right = x < width - 90;
          const r = s.stays.length ? 8 : 4;
          return (
            <g key={s.k} style={{ cursor: onPick && s.stays.length ? "pointer" : "default" }} onClick={() => onPick && s.stays.length && onPick(s.stays[0])}>
              <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth="1.6" />
              {s.nums.length > 0 && <text x={x} y={y + 3.2} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={st && (st.tone === "booked" || st.tone === "paid") ? "#fff" : "#15202B"} fontFamily="Spline Sans Mono, monospace">{s.nums.length > 1 ? s.nums[0] + "+" : s.nums[0]}</text>}
              {s._lab && <text x={s._lab.x} y={s._lab.y} textAnchor={s._lab.anchor} fontSize={fs} fontWeight={s.stays.length ? 700 : 400} fill="#15202B" fontFamily="Noto Sans JP, sans-serif" stroke="#F7F8F5" strokeWidth="3" paintOrder="stroke">{s._lab.text}</text>}
            </g>
          );
        })}
      </g>
      <text x={width - 8} y={height - 6} textAnchor="end" fontSize="8" fill="#8A929A" fontFamily="sans-serif">Map: Natural Earth</text>
    </svg>
  );
}
function MapLegend() {
  return (
    <div className="legendrow">
      <span><svg width="26" height="8" aria-hidden="true"><path d="M1 4h24" stroke="#15202B" strokeWidth="1.6" strokeDasharray="2 5" strokeLinecap="round" /></svg>飛行機</span>
      <span><svg width="26" height="8" aria-hidden="true"><path d="M1 4h24" stroke="#15202B" strokeWidth="1.6" /></svg>鉄道</span>
      <span><svg width="26" height="8" aria-hidden="true"><path d="M1 4h24" stroke="#15202B" strokeWidth="1.6" strokeDasharray="6 3" /></svg>バス・車</span>
      <span><svg width="26" height="8" aria-hidden="true"><path d="M1 4h24" stroke="#15202B" strokeWidth="1.6" strokeDasharray="8 4 2 4" /></svg>船</span>
      <span><svg width="26" height="8" aria-hidden="true"><path d="M1 4h24" stroke="#8A929A" strokeWidth="1.6" strokeDasharray="1 4" strokeLinecap="round" /></svg>手段未定</span>
      <span><i className="sw" style={{ width: 12, height: 12, borderRadius: 6, background: "var(--blue)" }} />宿 予約済み</span>
      <span><i className="sw" style={{ width: 12, height: 12, borderRadius: 6, background: "var(--orange-soft)", outline: "1.5px solid var(--orange)", outlineOffset: -1.5 }} />宿 未手配</span>
    </div>
  );
}
