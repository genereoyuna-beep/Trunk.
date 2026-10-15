// ================= 旅のしおり（A5の冊子。画面で見る・PDFで保存） =================
// 中身を小さな塊（見出し・1行）に分け、実際の高さを測ってページに流し込む。
const PAGE_W = 559, PAGE_H = 794, PAGE_PAD = 34, PAGE_HEAD = 26, PAGE_FOOT = 24;
const BODY_H = PAGE_H - PAGE_PAD * 2 - PAGE_HEAD - PAGE_FOOT;

// ---- 搭乗券・きっぷ風の部品（色は紺・青・グレーだけ。ラベルは英語） ----
const INK = "#15202B";
const WD_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const enDate = (iso) => iso ? `${iso.slice(5, 7)}.${iso.slice(8, 10)} ${WD_EN[new Date(iso + "T00:00:00Z").getUTCDay()]}` : "";
const fullDate = (iso) => iso ? `${iso.replace(/-/g, ".")} ${WD_EN[new Date(iso + "T00:00:00Z").getUTCDay()]}` : "—";
// 都市のコード（空港が複数ある都市など）
const CITY_CODES = { "東京": "TYO", "大阪": "OSA", "札幌": "SPK", "名古屋": "NGO", "福岡": "FUK", "沖縄": "OKA", "那覇": "OKA", "ソウル": "SEL", "釜山": "PUS", "済州": "CJU",
  "台北": "TPE", "台湾": "TPE", "高雄": "KHH", "台中": "RMQ", "香港": "HKG", "マカオ": "MFM", "上海": "SHA", "北京": "BJS", "バンコク": "BKK", "シンガポール": "SIN", "ホーチミン": "SGN", "ハノイ": "HAN",
  "ダナン": "DAD", "セブ": "CEB", "マニラ": "MNL", "バリ": "DPS", "ホノルル": "HNL", "ハワイ": "HNL", "グアム": "GUM", "ロサンゼルス": "LAX", "ニューヨーク": "NYC", "ロンドン": "LON", "パリ": "PAR",
  "ミラノ": "MIL", "ローマ": "ROM", "ストックホルム": "STO", "ブリュッセル": "BRU", "アムステルダム": "AMS", "フランクフルト": "FRA", "ミュンヘン": "MUC", "ウィーン": "VIE", "プラハ": "PRG", "ヘルシンキ": "HEL", "ドバイ": "DXB" };
// 地名から3文字コード（「(KIX)」の表記、都市コード、主な空港の一覧の順に探す）
function codeFor(name) {
  const n = String(name || ""), m = n.match(/\(([A-Z]{3})\)/);
  if (m) return m[1];
  const city = Object.keys(CITY_CODES).find(k => splitCity(n).main.startsWith(k));
  if (city) return CITY_CODES[city];
  const main = splitCity(n).main.replace(/\(.*$/, "");
  const hit = AIRPORTS.find(a => { const ja = a.replace(/\(.*$/, ""); return main && (ja.includes(main) || main.includes(ja.split("・")[0])); });
  return hit ? hit.match(/\(([A-Z]{3})\)/)[1] : "";
}
const placeLabel = (n) => splitCity(n).main.replace(/\s*\([A-Z]{3}\)\s*$/, "");
// 旅行名から決まるバーコード風の線
function Barcode({ seed, w = 150, h = 34 }) {
  let x = 0, k = 0; const bars = [];
  const str = String(seed || "trip");
  while (x < w) { const c = str.charCodeAt(k % str.length) + k * 7; const bw = 1 + (c % 3), gap = 1 + ((c >> 2) % 3); if (x + bw > w) break; bars.push(<rect key={k} x={x} y="0" width={bw} height={h} fill={INK} />); x += bw + gap; k++; }
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: "block" }}>{bars}</svg>;
}
const MODE_ART = { "飛行機": "plane", "鉄道": "train", "夜行列車": "train", "バス": "bus", "フェリー": "ship", "夜行フェリー": "ship", "車": "car" };

function shioriUnits(t) {
  const U = [];
  const r = tripRange(t);
  const H = (key, title, sub, en) => U.push({ key, keepNext: true, el: <div className="sh-h2"><span className="sh-h2t"><span className="sh-stamp">{en}</span>{title}</span>{sub && <small className="mono">{sub}</small>}</div> });
  // 表紙（1ページまるごと）
  const route = uniq(sortItinerary(staysOf(t)).filter(s => s.city).map(s => splitCity(s.city).main));
  const sorted = sortItinerary(t.itinerary || []);
  const startPlace = sorted.length ? (sorted[0].type === "transit" ? sorted[0].fromCity : sorted[0].city) : "";
  const lastRow = sorted[sorted.length - 1];
  const endPlace = lastRow ? (lastRow.type === "transit" ? lastRow.toCity : lastRow.city) : "";
  const round = startPlace && splitCity(startPlace).main === splitCity(endPlace).main;
  const toPlace = round ? (route[0] || endPlace) : endPlace;
  // 往復なら、行きの便の到着空港のコードを使う（例：ソウル → ICN）
  const firstMove = sorted.find(x => x.type === "transit");
  const fromCode = codeFor(startPlace);
  const toCode = (round && firstMove && codeFor(firstMove.toCity)) || codeFor(toPlace);
  const BigPlace = ({ code, name }) => code ? <b className="mono">{code}</b> : <b className="tk-bigname">{splitCity(name).main || "—"}</b>;
  const pax = (t.participants || []).join(" / ") || "—";
  U.push({ key: "cover", page: true, el: (
    <div className="tk">
      <div className="tk-band"><b>BOARDING PASS</b><span>TRAVEL ITINERARY</span></div>
      <div className="tk-main">
        <div className="tk-label">TRIP</div>
        <h1 className="tk-name">{t.name}</h1>
        <div className="tk-route">
          <div><div className="tk-label">FROM</div><BigPlace code={fromCode} name={startPlace} />{fromCode && <span>{placeLabel(startPlace)}</span>}</div>
          <div className="tk-plane"><span /><Icon n="plane" s={20} w={1.6} /><span /></div>
          <div style={{ textAlign: "right" }}><div className="tk-label">{round ? "TO / ROUND TRIP" : "TO"}</div><BigPlace code={toCode} name={toPlace} />{toCode && <span>{placeLabel(toPlace)}</span>}</div>
        </div>
        <div className="tk-grid">
          <div><div className="tk-label">DEPART</div><span className="mono">{r ? fullDate(r.start) : "—"}</span></div>
          <div><div className="tk-label">RETURN</div><span className="mono">{r ? fullDate(r.end) : "—"}</span></div>
          <div><div className="tk-label">DAYS</div><span className="mono">{r ? r.days : "—"}</span></div>
          <div><div className="tk-label">CITIES</div><span className="mono">{route.length || "—"}</span></div>
          <div className="tk-wide"><div className="tk-label">PASSENGERS</div><span>{pax}</span></div>
        </div>
        {route.length > 0 && <div className="tk-via"><div className="tk-label">VIA</div><span>{route.join("  ·  ")}</span></div>}
      </div>
      <div className="tk-perf" />
      <div className="tk-stub">
        <div>
          <div className="tk-label">STUB</div>
          <b className="mono">{fromCode || splitCity(startPlace).main || "—"} → {toCode || splitCity(toPlace).main || "—"}</b>
          <span className="mono">{r ? `${fullDate(r.start)} – ${r.days} DAYS` : ""}</span>
          <span className="mono tk-issued">ISSUED {todayISO().replace(/-/g, ".")}</span>
        </div>
        <Barcode seed={t.name + (r ? r.start : "")} />
      </div>
    </div>
  ) });
  if (!r) return U;
  const days = Array.from({ length: r.days }, (_, i) => addDays(r.start, i));
  if (routeOf(t).stops.some(x => x.stays.length)) {
    H("map", "ルートマップ", `${route.length} CITIES`, "ROUTE MAP");
    U.push({ key: "mapimg", el: <div className="sh-map"><RouteMap t={t} width={PAGE_W - PAGE_PAD * 2} height={470} compact /></div> });
    U.push({ key: "maplegend", breakAfter: true, el: <div className="sh-maplegend"><MapLegend /></div> });
  }
  // 旅程表
  H("ov", "旅程表", `${r.days} DAYS`, "ITINERARY");
  U.push({ key: "ovh", el: <div className="sh-ovrow sh-ovhead-row"><span>DAY</span><span>DATE</span><span>DESTINATION</span><span>STAY</span></div> });
  days.forEach((d, i) => {
    const { head, sleeping, night } = dayEvents(t, d);
    U.push({ key: "ov" + d, el: (
      <div className="sh-ovrow">
        <span className="mono sh-dn">{String(i + 1).padStart(2, "0")}</span>
        <span className="mono">{enDate(d)}</span>
        <span className="sh-ovhead">{head}</span>
        <span className="sh-ovnight">{sleeping ? night.name || "宿未定" : "—"}</span>
      </div>
    ) });
  });
  // 出発前の手続き
  const ecs = ((t.entryChecks && t.entryChecks.items) || []);
  if (ecs.length) {
    H("ec", "出発前の手続き", `${ecs.filter(i => i.done).length}/${ecs.length} DONE`, "BEFORE YOU GO");
    ecs.forEach(i => U.push({ key: "ec" + i.id, el: <div className="sh-ec"><i className={i.done ? "on" : ""} /><span><b>{i.title}</b><small>{i.country}{i.applyBy ? ` ・ ${md(i.applyBy)}までに` : ""}{i.detail ? ` ・ ${i.detail}` : ""}</small></span></div> }));
  }
  // 日ごと
  days.forEach((d, i) => {
    const { ev, head, sleeping, night } = dayEvents(t, d);
    const mv = transitsOf(t).find(x => isLeg(x) && x.departDate === d && MODE_ART[x.mode]);
    U.push({ key: "dh" + d, keepNext: true, gap: true, el: <div className="sh-dayh"><div className="sh-dayno"><small>DAY</small><b className="mono">{String(i + 1).padStart(2, "0")}</b></div><div className="sh-daymain"><span className="mono">{enDate(d)}</span><b>{head}</b></div><i className="sh-dayico"><Icon n={mv ? MODE_ART[mv.mode] : "pin"} s={20} w={1.5} /></i></div> });
    if (!ev.length) U.push({ key: "de" + d, el: <div className="sh-ev"><span className="mono sh-tm">—</span><span className="sh-muted">予定なし（自由行動）</span></div> });
    ev.forEach((e, j) => U.push({ key: `ev${d}-${j}`, el: (
      <div className="sh-ev">
        <span className="mono sh-tm">{e.time ? e.time.slice(0, 11) : "—"}</span>
        <span><b>{e.title}</b>{e.sub && <small>{e.sub}</small>}</span>
      </div>
    ) }));
    if (sleeping) U.push({ key: "dn" + d, el: <div className="sh-night"><span className="mono" style={{ letterSpacing: ".16em" }}>TONIGHT</span><b>{night.name || "宿未定"}</b>{night.address && <small>{night.address}</small>}</div> });
    const starting = staysOf(t).find(s => s.startDate === d);
    if (starting && starting.memo) U.push({ key: "dm" + d, el: <div className="sh-memo">{starting.memo}</div> });
  });
  // 泊まるところ
  const stays = sortItinerary(staysOf(t)).filter(s => isISO(s.startDate));
  if (stays.length) {
    H("st", "泊まるところ", "", "STAY");
    stays.forEach(s => {
      const h = hotelOf(t, s) || {};
      U.push({ key: "st" + s.id, el: (
        <div className="sh-card">
          <div className="sh-card-top"><span className="mono">{md(s.startDate)}〜{md(stayEnd(s))}・{nightsOf(s)}泊</span><span>{splitCity(s.city).main}</span><span className="sh-tag">{stayState(t, s).label}</span></div>
          <b>{s.noHotel ? (s.lodgingLabel || "宿不要") : h.name || "宿未定"}</b>
          {!s.noHotel && (h.address || h.checkinTime || h.confirmation || h.site) && (
            <div className="sh-kv">
              {h.address && <><span>住所</span><span>{h.address}</span></>}
              {(h.checkinTime || h.checkoutTime) && <><span>時間</span><span className="mono">IN {h.checkinTime || "—"} ／ OUT {h.checkoutTime || "—"}</span></>}
              {(h.site || h.confirmation) && <><span>予約</span><span>{[h.site, h.confirmation && `番号 ${h.confirmation}`].filter(Boolean).join(" ・ ")}</span></>}
            </div>
          )}
        </div>
      ) });
    });
  }
  // 交通
  const trs = sortItinerary(transitsOf(t)).filter(x => isISO(x.departDate) && (isLeg(x) || transitState(x).key !== "free")); // 予約のいらない街の中の移動は日ごとのページだけ
  if (trs.length) {
    H("tr", "交通", "", "TRANSPORT");
    trs.forEach(x => U.push({ key: "tr" + x.id, el: (
      <div className="sh-tr">
        <span className="mono">{md(x.departDate)}<small>（{wdOf(x.departDate)}）</small></span>
        <span><b>{moveTitle(x)}</b><small>{[x.mode, x.airline, x.departTime && `${x.departTime}発`, x.arriveTime && `${x.arriveDate && x.arriveDate !== x.departDate ? md(x.arriveDate) + " " : ""}${x.arriveTime}着`, calcDuration(x)].filter(Boolean).join(" ・ ")}</small></span>
        <span className="sh-tag">{transitState(x).label}</span>
      </div>
    ) }));
  }
  // 費用の目安
  const cost = myShare({ ...t, myName: "" });
  if (cost.total > 0) {
    H("cs", "費用の目安", "PER PERSON", "BUDGET");
    U.push({ key: "cs", el: (
      <div className="sh-cost">
        <div><span>宿</span><b className="mono">{yen(cost.hotel)}</b></div>
        <div><span>移動</span><b className="mono">{yen(cost.flight)}</b></div>
        <div><span>現地</span><b className="mono">{yen(cost.localTransport + cost.localActivity)}</b></div>
        <div className="sh-cost-total"><span>合計</span><b className="mono">{yen(cost.total)}</b></div>
        <small>金額÷人数の目安。食費・お土産・未定の分は入っていません。</small>
      </div>
    ) });
  }
  // 持ち物
  const cats = Object.entries(t.packing || {}).filter(([, items]) => items.length);
  if (cats.length) {
    H("pk", "持ち物", "", "PACKING");
    cats.forEach(([c, items]) => U.push({ key: "pk" + c, el: (
      <div className="sh-pack"><b>{c}</b><div>{items.map(i => <span key={i.id}><i className={i.checked ? "on" : ""} />{i.name}</span>)}</div></div>
    ) }));
  }
  // 緊急時の情報
  const em = t.emergency || {}, ecn = t.emergencyCountries || [];
  const mine = [["パスポート", [em.passportNo, em.passportExp && `有効期限 ${em.passportExp.replace(/-/g, ".")}`].filter(Boolean).join(" ・ ")], ["海外旅行保険", [em.insurer, em.policyNo && `証券番号 ${em.policyNo}`, em.insurerPhone].filter(Boolean).join(" ・ ")], ["連絡先", em.contacts], ["医療メモ", em.medical]].filter(([, v]) => v);
  if (mine.length || ecn.length) {
    H("em", "緊急時の情報", "", "EMERGENCY");
    if (mine.length) U.push({ key: "emme", el: <div className="sh-kv sh-em">{mine.map(([k, v]) => <React.Fragment key={k}><span>{k}</span><span style={{ whiteSpace: "pre-wrap" }}>{v}</span></React.Fragment>)}</div> });
    ecn.forEach((c, i) => U.push({ key: "emc" + i, el: (
      <div className="sh-card">
        <div className="sh-card-top"><b style={{ fontSize: 12.5, color: "#15202B" }}>{c.country}</b><span className="mono">緊急 {c.general || "—"} ・ 警察 {c.police || "—"} ・ 救急 {c.ambulance || "—"}</span></div>
        {c.embassy && c.embassy.name && <div className="sh-kv"><span>大使館</span><span>{c.embassy.name} <span className="mono">{c.embassy.phone}</span><br />{c.embassy.address}</span></div>}
      </div>
    ) }));
  }
  // フレーズ集：主要なものを表にして詰める（3言語ずつ横に並べる。1言語なら2列）
  const mode = t.shioriPhrases || "essential";
  const books = Object.values(t.phrases || {}).filter(p => (p.items || []).length && !SKIP_LANGS.has(p.lang));
  const en = (j) => PHRASE_EN[j] || j;
  if (mode !== "none" && books.length) {
    const pick = (ph) => (ph.items || []).filter(i => i.cat !== "数字" && (mode === "all" || PHRASE_ESSENTIAL.has(i.ja)));
    const base = pick(books[0]).map(i => i.ja);
    const ja = uniq([...base, ...books.slice(1).flatMap(b => pick(b).map(i => i.ja))]);
    const find = (ph, j) => (ph.items || []).find(i => i.ja === j);
    const nums = (ph) => (ph.items || []).filter(i => i.cat === "数字");
    H("ph", "フレーズ集", books.length > 1 ? `${books.length} LANGUAGES` : books[0].lang, "PHRASES");
    if (books.length === 1) {
      const ph = books[0];
      for (let i = 0; i < ja.length; i += 2) {
        U.push({ key: "p1" + i, el: <div className="sh-pg2">{[ja[i], ja[i + 1]].filter(Boolean).map(j => { const p = find(ph, j) || {}; return <div key={j}><span>{en(j)}</span><b>{p.local}</b>{p.reading && <small>{p.reading}</small>}</div>; })}</div> });
      }
      if (nums(ph).length) U.push({ key: "p1n", el: <div className="sh-pnum"><span>NUMBERS</span><div>{nums(ph).map(n => <span key={n.ja}><i>{n.ja}</i>{n.local}</span>)}</div></div> });
    } else {
      for (let g = 0; g < books.length; g += 3) {
        const grp = books.slice(g, g + 3);
        const head = (k) => U.push({ key: k, keepNext: true, gap: true, el: <div className="sh-ptab sh-ptab-h"><span>English</span>{grp.map(b => <span key={b.lang}>{b.lang}</span>)}{grp.length < 3 && Array.from({ length: 3 - grp.length }, (_, i) => <span key={"e" + i} />)}</div> });
        ja.forEach((j, r) => {
          if (r % 22 === 0) head(`ph${g}h${r}`); // 見出し行を22行ごとに入れ直す（ページをまたいでも読めるように）
          U.push({ key: `ph${g}-${r}`, el: <div className="sh-ptab"><span className="sh-en">{en(j)}</span>{grp.map(b => { const p = find(b, j); return <span key={b.lang}>{p ? <><b>{p.local}</b>{p.reading && <small>{p.reading}</small>}</> : "—"}</span>; })}{grp.length < 3 && Array.from({ length: 3 - grp.length }, (_, i) => <span key={"e" + i} />)}</div> });
        });
        U.push({ key: `ph${g}n`, el: <div className="sh-ptab sh-ptab-n"><span>Numbers 1–10</span>{grp.map(b => <span key={b.lang}>{nums(b).map(n => n.local).join(" · ")}</span>)}{grp.length < 3 && Array.from({ length: 3 - grp.length }, (_, i) => <span key={"e" + i} />)}</div> });
      }
    }
  }
  // メモ欄
  H("mm", "メモ", "", "NOTES");
  for (let i = 0; i < 8; i++) U.push({ key: "mm" + i, el: <div className="sh-line" /> });
  U.push({ key: "bye", gap: true, el: (
    <div className="tk-bye">
      <div><div className="tk-label">ADMIT ONE</div><b>BON VOYAGE</b><span>いってらっしゃい！よい旅を。</span></div>
      <Barcode seed={t.name} w={110} h={30} />
    </div>
  ) });
  return U;
}

// 高さを測ってページに振り分ける
function usePagination(units) {
  const measureRef = useRef(null);
  const [pages, setPages] = useState(null);
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setFontTick(x => x + 1)); }, []);
  React.useLayoutEffect(() => {
    const box = measureRef.current;
    if (!box) return;
    const hs = [...box.children].map(c => c.getBoundingClientRect().height);
    const out = []; let cur = [], used = 0;
    const flush = () => { if (cur.length) out.push(cur); cur = []; used = 0; };
    units.forEach((u, i) => {
      if (u.page) { flush(); out.push([i]); return; }
      let h = hs[i] + (u.gap && cur.length ? 14 : 0);
      // 見出しは次の1行と一緒に置く（本文の上の余白 10px と、ゆとり 4px を引いた高さに収める）
      const need = u.keepNext && units[i + 1] ? h + hs[i + 1] : h;
      if (used + need > BODY_H - 14 && cur.length) { flush(); h = hs[i]; }
      cur.push(i); used += h;
      if (u.breakAfter) flush(); // ルートマップのページはここで区切る
    });
    flush();
    setPages(out);
  }, [units, fontTick]);
  return { measureRef, pages };
}

function ShioriPage({ t, n, total, children }) {
  return (
    <div className="sh-page" style={{ width: PAGE_W, height: PAGE_H, padding: PAGE_PAD }}>
      <div className="sh-run" style={{ height: PAGE_HEAD }}><span>TRAVEL ITINERARY</span><span>{t.name}</span></div>
      <div className="sh-body" style={{ height: BODY_H }}>{children}</div>
      <div className="sh-foot mono" style={{ height: PAGE_FOOT }}>— {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")} —</div>
    </div>
  );
}

function Shiori({ t, exportRef }) {
  const units = useMemo(() => shioriUnits(t), [t]);
  const { measureRef, pages } = usePagination(units);
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const f = () => setScale(Math.min(1, el.clientWidth / PAGE_W));
    f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect();
  }, []);
  const render = (list, pi) => list.map(i => <div key={units[i].key} className={"sh-u" + (units[i].gap && list[0] !== i ? " sh-gap" : "")}>{units[i].el}</div>);
  return (
    <div ref={wrapRef} className="sh-wrap">
      {/* 測定用（見えない） */}
      <div ref={measureRef} className="sh-measure" style={{ width: PAGE_W - PAGE_PAD * 2 }} aria-hidden="true">
        {units.map(u => <div key={u.key} className="sh-u">{u.el}</div>)}
      </div>
      {!pages && <p className="empty">しおりを組んでいます…</p>}
      {pages && pages.map((list, pi) => (
        <div key={pi} className="sh-view" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            {units[list[0]].page ? <div className="sh-page sh-cover-page" style={{ width: PAGE_W, height: PAGE_H, padding: PAGE_PAD }}>{units[list[0]].el}</div>
              : <ShioriPage t={t} n={pi + 1} total={pages.length}>{render(list, pi)}</ShioriPage>}
          </div>
        </div>
      ))}
      {/* PDF用（等倍・画面外） */}
      {pages && exportRef && (
        <div ref={exportRef} className="sh-export" aria-hidden="true">
          {pages.map((list, pi) => units[list[0]].page
            ? <div key={pi} className="sh-page sh-cover-page" style={{ width: PAGE_W, height: PAGE_H, padding: PAGE_PAD }}>{units[list[0]].el}</div>
            : <ShioriPage key={pi} t={t} n={pi + 1} total={pages.length}>{render(list, pi)}</ShioriPage>)}
        </div>
      )}
    </div>
  );
}

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("load " + src)); document.head.appendChild(s);
  });
}
// 各ページを画像にして A5 の PDF にまとめる（日本語の文字も崩れない）
async function shioriToPDF(container, onProgress) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const pages = [...container.children];
  const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });
  for (let i = 0; i < pages.length; i++) {
    onProgress && onProgress(i + 1, pages.length);
    const c = await window.html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", logging: false });
    if (i) pdf.addPage("a5", "portrait");
    pdf.addImage(c.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 148, 210);
  }
  return pdf.output("blob");
}

function ShioriView({ t, canExport, update }) {
  const exportRef = useRef(null);
  const [st, setSt] = useState("");
  const save = async () => {
    if (!exportRef.current) return;
    setSt("PDFを作っています…");
    try {
      const blob = await shioriToPDF(exportRef.current, (i, n) => setSt(`PDFを作っています（${i}/${n}ページ）…`));
      setSt((await saveFile(`${t.name || "旅のしおり"}.pdf`, blob)) ? "保存しました" : "この表示ではファイルを保存できません");
    } catch (e) { setSt("PDFを作れませんでした。もう一度お試しください"); }
  };
  return (
    <div className="stack">
      {canExport && (
        <div className="row between">
          <span className="small muted">{st || "A5サイズのしおりです。PDFにしてLINEで送ったり印刷したりできます。"}</span>
          <button className="btn primary" disabled={st.startsWith("PDFを作って")} onClick={save}>PDFで保存</button>
        </div>
      )}
      {update && Object.keys(t.phrases || {}).length > 0 && (
        <label className="row small" htmlFor="sh-phr-mode" style={{ gap: 8 }}>フレーズ集
          <select id="sh-phr-mode" className="input" style={{ width: "auto" }} value={t.shioriPhrases || "essential"} onChange={e => update(tr => ({ ...tr, shioriPhrases: e.target.value }))}>
            <option value="essential">主要なフレーズだけ（おすすめ）</option>
            <option value="all">すべて（{PHRASE_LIST.length}フレーズ）</option>
            <option value="none">しおりに入れない</option>
          </select>
        </label>
      )}
      <Shiori t={t} exportRef={canExport ? exportRef : null} />
    </div>
  );
}
