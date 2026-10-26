const { useState, useEffect, useMemo, useRef } = React;

// ================= アイコン =================
const ICONS = {
  share: <><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></>,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  ticket: <><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2z" /><path d="M13 6v12" strokeDasharray="2 2" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /></>,
  bag: <><path d="M6 8h12l1 12H5z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  dots: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
  down: <path d="M6 9l6 6 6-6" />,
  plane: <path d="M2 16l20-6-3-2-7 2-5-5-2 1 3 6-4 1-2-2-1 1z" />,
  train: <><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 10h14M8 20l-2 2M16 20l2 2M9 13h.01M15 13h.01" /></>,
  ship: <><path d="M3 17l2 3h14l2-3-9-3z" /><path d="M6 15V8h12v7M12 4v4" /></>,
  bus: <><rect x="4" y="4" width="16" height="13" rx="2" /><path d="M4 11h16M8 21v-4M16 21v-4" /></>,
  car: <><path d="M5 16l1.5-5h11L19 16" /><rect x="3" y="15" width="18" height="4" rx="1" /><path d="M7 19v2M17 19v2" /></>,
  question: <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5h.01" />,
  bed: <><path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6" /><circle cx="7" cy="11" r="2" /></>,
  route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l5 5L20 7" />,
  map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  pin: <><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  paste: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6" /></>,
  pencil: <><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></>,
  food: <><path d="M7 3v8a2 2 0 0 0 4 0V3M9 3v18M17 3c-1.7 0-3 2-3 5v5h3v8" /></>,
  ext: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
};
function Icon({ n, s = 18, w = 2 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[n]}</svg>;
}
// 旅程で移動の線につける色（手段ごと）
const modeColor = (m) => /飛行機/.test(m) ? "#1F3A5F" : /鉄道|夜行列車|地下鉄|電車/.test(m) ? "#2D6CDF" : /バス/.test(m) ? "#2E8B57" : /タクシー|車|Uber|送迎|レンタカー/.test(m) ? "#C98A00" : /フェリー|船/.test(m) ? "#1A8C9C" : "#8A9199";
// 予定の種類ごとのアイコン（観光はカメラ、ツアーは旗、入場券はチケット、その他体験は星）
const catIcon = (c) => ({ 移動: "route", 観光: "camera", 食事: "food", 買い物: "bag", ツアー: "flag", 入場券: "ticket", その他体験: "star" })[c] || "ticket";
const modeIcon = (m) => m === "飛行機" ? "plane" : (m === "鉄道" || m === "夜行列車" || m === "地下鉄") ? "train" : (m === "フェリー" || m === "夜行フェリー") ? "ship" : m === "バス" ? "bus" : (m === "車" || m === "タクシー") ? "car" : (m === "徒歩" || m === "その他") ? "route" : "question";
const Pill = ({ st }) => <span className={"pill tone-" + st.tone}><i />{st.label}</span>;
const NAV = [["home", "ホーム", "home"], ["plan", "旅程", "cal"], ["book", "予約・手配", "ticket"], ["money", "お金", "wallet"], ["pack", "持ち物", "bag"]];
const TABS = NAV.map(n => n[0]);

// ================= 入力の部品 =================
// opt：入れなくてよい欄。見出しを薄く、枠を点線にして「任意」と出す
function Field({ label, wide, opt, children }) {
  return <label className={"field" + (wide ? " wide" : "") + (opt ? " opt" : "")}><span>{label}{opt && <em className="opt-tag">任意</em>}</span>{children}</label>;
}
function TextIn({ value, onChange, ...p }) { return <input type="text" value={value ?? ""} onChange={e => onChange(e.target.value)} {...p} />; }
const SuggestCtx = React.createContext({ cities: [], usedCarriers: [], sites: BOOKING_SITES, addresses: [], descs: [] });
let suggestSeq = 0;
function SuggestIn({ value, onChange, options, ...p }) {
  const id = useRef("sg-" + (++suggestSeq)).current;
  const opts = uniq(options || []).filter(o => o !== value).slice(0, 80);
  return <><input type="text" list={id} value={value ?? ""} onChange={e => onChange(e.target.value)} autoComplete="off" {...p} /><datalist id={id}>{opts.map(o => <option key={o} value={o} />)}</datalist></>;
}
// 場所の入力：Trunk. では、旅行の中の場所（都市・空港など）と Google の候補を一緒に出す。ないとき（アーティファクト版）は今までどおり
// Google の候補で選んだ場所の位置（緯度・経度）を、地図のために旅行へ保存する
const GeoCtx = React.createContext(null);
// 候補から選んだ場所の位置（予定や宿そのものに持たせる。手で打ち替えたら消す）
const llOf = (r) => r && r.lat != null && r.lng != null ? [Math.round(r.lat * 1e4) / 1e4, Math.round(r.lng * 1e4) / 1e4] : null;
function PlaceIn({ value, onChange, onPick, kind, options, placeholder }) {
  const saveGeo = React.useContext(GeoCtx);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const tm = useRef(null), seq = useRef(0);
  if (typeof Places === "undefined") return options ? <SuggestIn value={value} onChange={onChange} options={options} placeholder={placeholder} /> : <TextIn value={value} onChange={onChange} placeholder={placeholder} />;
  const q = String(value || "").trim().toLowerCase();
  // 何も打っていないときは何も出さない。打ったら、旅行の中の場所で合うものを少しだけ先に出す
  const local = q ? uniq((options || []).filter(Boolean)).filter(o => o !== value && o.toLowerCase().includes(q)).slice(0, 3) : [];
  const type = (v) => {
    onChange(v); setOpen(true);
    clearTimeout(tm.current);
    const n = ++seq.current;
    if (String(v).trim().length < 2) { setItems([]); return; }
    tm.current = setTimeout(() => { Places.suggest(v, kind).then(x => { if (n === seq.current) setItems(x); }).catch(() => setItems([])); }, 350);
  };
  const pick = async (it) => {
    setOpen(false); setItems([]);
    try {
      const r = await it.pick();
      onPick ? onPick(r, it) : onChange(r.name || it.main);
      if (saveGeo && r.lat != null && r.lng != null) saveGeo([r.name, it.main, r.address], [Math.round(r.lat * 1e4) / 1e4, Math.round(r.lng * 1e4) / 1e4]);
    } catch (e) { onChange(it.main); }
  };
  const show = open && (local.length > 0 || items.length > 0);
  return (
    <div style={{ position: "relative" }}>
      <input type="text" value={value ?? ""} placeholder={placeholder} autoComplete="off" onChange={e => type(e.target.value)} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)} />
      {show && (
        <div className="card flush divide" role="listbox" style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", zIndex: 30, boxShadow: "0 8px 24px rgba(21,32,43,.14)", maxHeight: 300, overflow: "auto", minWidth: 220 }}>
          {local.map(o => (
            <button key={"l" + o} type="button" role="option" className="bookrow" style={{ gridTemplateColumns: "minmax(0,1fr)", width: "100%", textAlign: "left" }} onMouseDown={e => { e.preventDefault(); setOpen(false); onChange(o); }}>
              <span className="t1">{o}</span>
            </button>
          ))}
          {items.map((it, i) => (
            <button key={"g" + i} type="button" role="option" className="bookrow" style={{ gridTemplateColumns: "minmax(0,1fr)", width: "100%", textAlign: "left" }} onMouseDown={e => { e.preventDefault(); pick(it); }}>
              <span style={{ minWidth: 0 }}><span className="t1">{it.main}</span>{it.sub && <span className="t2">{it.sub}</span>}</span>
            </button>
          ))}
          {items.length > 0 && <div className="xs muted" style={{ padding: "4px 12px", textAlign: "right" }}>Google の候補</div>}
        </div>
      )}
    </div>
  );
}
// 金額・人数などの数。0より下にはしない（矢印キーや上下のボタンでうっかり -1 にならないように）
// 金額と通貨。外貨なら元の金額（priceAmt）と通貨（priceCur）を持ち、円の金額（price / total）はレートで換算して入れる
function MoneyIn({ t, item, field = "price", onChange, update }) {
  const curs = ["JPY", ...tripCurrencies(t)];
  const cur = item.priceCur && item.priceCur !== "JPY" ? item.priceCur : "JPY";
  const amt = cur === "JPY" ? item[field] : item.priceAmt;
  // 外貨を選んでレートがまだなければ、今日の目安のレートを取ってきて入れる（無料・キー不要の ExchangeRate-API）
  const tried = useRef(""), latest = useRef(item);
  latest.current = item; // レートが届いた時点の金額で換算する（届くまでに打ち直していることがあるため）
  useEffect(() => {
    if (cur === "JPY" || hasRate(t, cur) || !update || FEATURES.ai || tried.current === cur) return;
    tried.current = cur;
    fetch("https://open.er-api.com/v6/latest/JPY").then(r => r.json()).then(d => {
      const v = Number(d && d.rates && d.rates[cur]);
      if (!(v > 0)) return;
      const rate = Math.round(10000 / v) / 10000;
      update(tr => ({ ...tr, rates: { ...(tr.rates || {}), [cur]: rate }, ratesAsOf: tr.ratesAsOf || todayISO() }));
      const a = Number(latest.current.priceAmt);
      if (a > 0 && latest.current.priceCur === cur) onChange({ [field]: Math.round(a * rate) });
    }).catch(() => {});
  }, [cur]);
  const put = (v, c) => onChange(c === "JPY" ? { [field]: v, priceCur: "", priceAmt: 0 } : { priceAmt: v, priceCur: c, [field]: hasRate(t, c) ? Math.round(toJPY(t, v, c)) : 0 });
  return (
    <>
      <div className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
        <NumIn value={amt} onChange={v => put(v, cur)} style={{ flex: 1, minWidth: 0 }} />
        <select aria-label="通貨" style={{ width: 82, flex: "none" }} value={cur} onChange={e => put(Number(amt) || 0, e.target.value)}>{uniq([...curs, cur]).map(c => <option key={c} value={c}>{c === "JPY" ? "円" : c}</option>)}</select>
      </div>
      {cur !== "JPY" && Number(amt) > 0 && <span className="xs muted" style={{ display: "block", marginTop: 2 }}>{hasRate(t, cur) ? `≒ ${yen(Math.round(toJPY(t, amt, cur)))}（予算や合計は円で計算します）` : "この通貨のレートが未入力のため、合計に入りません（お金 → 支出 の「通貨の換算」で入れられます）"}</span>}
    </>
  );
}
// 一覧に出す金額：外貨なら「16,000 KRW（≒¥1,700）」
const priceText = (x, field = "price") => x.priceCur && x.priceCur !== "JPY" && Number(x.priceAmt) > 0 ? `${Number(x.priceAmt).toLocaleString("ja-JP")} ${x.priceCur}${Number(x[field]) > 0 ? `（≒${yen(x[field])}）` : ""}` : yen(x[field]);
function NumIn({ value, onChange, ...p }) { return <input type="number" inputMode="numeric" min="0" value={value === 0 || value ? value : ""} onWheel={e => e.target.blur()} onChange={e => onChange(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value) || 0))} {...p} />; }
function DateIn({ value, onChange }) { return <input type="date" value={value || ""} onChange={e => onChange(e.target.value)} />; }
function TimeIn({ value, onChange }) { return <input type="time" value={value || ""} onChange={e => onChange(e.target.value)} />; }
function Toggle({ checked, onChange, children }) {
  return <label className="toggle"><input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />{children}</label>;
}
// 状態：未予約／予約済み（＋キャンセル条件）／支払い済み
// ヨーロッパの中か（Omio のリンクを出すかどうか）
const inEurope = (ll) => !!ll && ll[0] > 34 && ll[0] < 72 && ll[1] > -25 && ll[1] < 45;
// 紹介料が入るリンク（Trunk. 版だけ）。「PR」と、料金が変わらないことを必ず添える
// copy があるときは、押したときにその文字（行き先など）をコピーする（リンク先に行き先を渡せない広告のため）
// アクセス解析のイベント（Trunk. のアナリティクスがあるときだけ送る。個人の情報は入れない）
const track = (name, params) => { try { if (typeof gtag === "function") gtag("event", name, params || {}); } catch (e) {} };
// 紹介先の名前（リンクの文言から）
const partnerOf = (label) => /アゴダ/.test(label) ? "agoda" : /Klook/i.test(label) ? "klook" : /Omio/i.test(label) ? "omio" : /Airalo|eSIM/i.test(label) ? "airalo" : "other";
function AffLink({ href, label, copy }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => { track("affiliate_click", { partner: partnerOf(label) }); if (!copy) return; try { navigator.clipboard.writeText(copy).then(() => setCopied(true), () => {}); } catch (e) {} };
  return (
    <div style={{ margin: "8px 0" }}>
      <div className="row" style={{ alignItems: "center" }}>
        <a className="btn small" href={href} target="_blank" rel="noopener sponsored" onClick={onClick}><Icon n="ext" s={14} />{label}</a>
        <span className="xs muted" style={{ border: "1px solid var(--line)", borderRadius: 4, padding: "0 4px" }}>PR</span>
      </div>
      {copy && <div className="xs muted" style={{ marginTop: 4 }}>{copied ? `「${copy}」をコピーしました。検索欄に貼り付けてください` : `押すと「${copy}」をコピーします`}</div>}
      <div className="xs muted" style={{ marginTop: 4 }}>このリンクから予約しても、料金は変わりません</div>
    </div>
  );
}
function BookingStatus({ status, paid, onStatus, onPaid, openLabel }) {
  const booked = isBooked(status);
  return (
    <>
      <div className="seg" role="tablist" aria-label="予約の状態">
        <button role="tab" aria-selected={!booked} onClick={() => onStatus("候補")}>{openLabel || "未予約"}</button>
        <button role="tab" aria-selected={booked} onClick={() => onStatus(booked ? status : BOOKED[0])}>予約済み</button>
      </div>
      {booked && (
        <div className="fgrid">
          <Field label="キャンセル条件">
            <select value={status} onChange={e => onStatus(e.target.value)}>
              {BOOKED.map(b => <option key={b} value={b}>{POLICY_LABEL[b]}</option>)}
            </select>
          </Field>
          <Toggle checked={paid === "支払い済み"} onChange={v => onPaid(v ? "支払い済み" : "未払い")}>支払い済み</Toggle>
        </div>
      )}
    </>
  );
}
function DeleteButton({ label, onDelete }) {
  const [sure, setSure] = useState(false);
  useEffect(() => { if (!sure) return; const t = setTimeout(() => setSure(false), 4000); return () => clearTimeout(t); }, [sure]);
  return <button className="btn danger block" onClick={() => sure ? onDelete() : setSure(true)}>{sure ? "もう一度押すと削除します" : label}</button>;
}

// ================= 編集パネル =================
function Sheet({ title, onClose, children, full }) {
  useEffect(() => { const f = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [onClose]);
  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"sheet" + (full ? " full" : "")} role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button className="iconbtn" aria-label="閉じる" onClick={onClose}><Icon n="x" /></button></header>
        <div className="body">{children}</div>
      </div>
    </div>
  );
}

function StayEditor({ t, id, update, close }) {
  const sg = React.useContext(SuggestCtx);
  const s = staysOf(t).find(x => x.id === id);
  if (!s) return <p className="empty">この滞在は削除されました。</p>;
  const h = hotelOf(t, s) || {};
  // 日付や泊数を変えてほかの滞在と重なったら、この滞在を優先して、もう一方を縮める
  const setStay = (patch) => update(tr => ({ ...tr, itinerary: ("startDate" in patch || "nights" in patch) ? markLegs(fixStayOverlaps(normalizeItinerary(tr.itinerary.map(x => x.id === id ? { ...x, ...patch } : x)), tr.hotels || [], id)) : normalizeItinerary(tr.itinerary.map(x => x.id === id ? { ...x, ...patch } : x)) }));
  const setHotel = (patch) => update(tr => {
    const hs = tr.hotels || [];
    return hs.some(x => x.linkedStayId === id)
      ? { ...tr, hotels: hs.map(x => x.linkedStayId === id ? { ...x, ...patch } : x) }
      : { ...tr, hotels: [...hs, { id: uid(), linkedStayId: id, city: s.city, name: "", guests: guessGuests(tr), total: 0, status: "候補", paymentStatus: "未払い", ...patch }] };
  });
  const remove = () => { update(tr => ({ ...tr, itinerary: tr.itinerary.filter(x => x.id !== id), hotels: (tr.hotels || []).filter(x => x.linkedStayId !== id) })); close(); };
  const n = Math.max(1, nightsOf(s));
  return (
    <>
      <div className="fgrid">
        <Field label="都市" wide><PlaceIn kind="city" value={s.city} onChange={v => setStay({ city: v })} onPick={(r, it) => setStay({ city: it.main })} options={sg.cities} placeholder="例：プラハ" /></Field>
        <Field label="到着日（泊まり始め）"><DateIn value={s.startDate} onChange={v => setStay({ startDate: v })} /></Field>
        <Field label="泊数"><select value={nightsOf(s)} onChange={e => setStay({ nights: Number(e.target.value) })}>{Array.from({ length: Math.max(31, nightsOf(s) + 1, 61) }, (_, i) => <option key={i} value={i}>{i === 0 ? "日帰り（0泊）" : `${i}泊`}</option>)}</select></Field>
        <Field label="メモ" opt wide><textarea value={s.memo || ""} onChange={e => setStay({ memo: e.target.value })} /></Field>
      </div>
      <Toggle checked={s.noHotel} onChange={v => setStay({ noHotel: v, lodgingLabel: v ? (s.lodgingLabel || "宿不要") : s.lodgingLabel })}>宿の手配はいらない（家族・友人宅など）</Toggle>
      {s.noHotel ? (
        <Field label="宿の代わりに表示する言葉" opt><TextIn value={s.lodgingLabel} onChange={v => setStay({ lodgingLabel: v })} placeholder="例：実家・友人宅" /></Field>
      ) : (
        <>
          <div className="formsec">宿</div>
          <BookingStatus status={h.status || "候補"} paid={h.paymentStatus} openLabel="未手配" onStatus={v => setHotel({ status: v })} onPaid={v => setHotel({ paymentStatus: v })} />
          {typeof FEATURES !== "undefined" && typeof FEATURES.hotelSearch === "function" && !isBooked(h.status) && s.city && <AffLink href={FEATURES.hotelSearch(splitCity(s.city).main)} label={`アゴダで${splitCity(s.city).main}の宿を探す`} />}
          <div className="fgrid">
            <Field label="宿泊先名" wide><PlaceIn value={h.name} onChange={v => setHotel({ name: v, nameEnTried: false })} onPick={(r, it) => setHotel({ name: r.name || it.main, ...(r.address ? { address: r.address } : {}), geo: llOf(r) })} placeholder="候補の宿もここに" /></Field>
            <Field label="総額"><MoneyIn t={t} update={update} item={h} field="total" onChange={p => setHotel({ ...p, perNight: Math.round((Number(p.total) || 0) / n) })} /></Field>
            <Field label="人数（総額は何人分か）" opt><select value={h.guests || guessGuests(t)} onChange={e => setHotel({ guests: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}人</option>)}</select></Field>
            {/* 宿の決まり（予約ページやメールに書いてある時刻）と、実際に行く予定の時刻は分けて持つ */}
            <div className="wide xs muted" style={{ marginBottom: -4 }}>宿の決まり（予約ページに書いてある時刻）</div>
            <Field label="チェックイン（何時から）" opt><select value={h.checkinTime || ""} onChange={e => setHotel({ checkinTime: e.target.value })}><option value="">未設定</option>{TIME_OPTIONS.map(x => <option key={x}>{x}</option>)}</select></Field>
            <Field label="チェックアウト（何時まで）" opt><select value={h.checkoutTime || ""} onChange={e => setHotel({ checkoutTime: e.target.value })}><option value="">未設定</option>{TIME_OPTIONS.map(x => <option key={x}>{x}</option>)}</select></Field>
            <div className="wide xs muted" style={{ marginBottom: -4 }}>実際に行く予定の時刻（決まっていなければ空のままで大丈夫）</div>
            <Field label="チェックインする時刻" opt><select value={h.planCheckin || ""} onChange={e => setHotel({ planCheckin: e.target.value })}><option value="">未定</option>{TIME_OPTIONS.map(x => <option key={x}>{x}</option>)}</select></Field>
            <Field label="チェックアウトする時刻" opt><select value={h.planCheckout || ""} onChange={e => setHotel({ planCheckout: e.target.value })}><option value="">未定</option>{TIME_OPTIONS.map(x => <option key={x}>{x}</option>)}</select></Field>
            {h.planCheckin && h.checkinTime && h.planCheckin < h.checkinTime && <div className="wide xs" style={{ color: "var(--orange)" }}>チェックインの決まり（{h.checkinTime}から）より早く着く予定です。荷物を預けられるか、アーリーチェックインができるか、宿に確かめておくと安心です。</div>}
            {h.planCheckout && h.checkoutTime && h.planCheckout > h.checkoutTime && <div className="wide xs" style={{ color: "var(--orange)" }}>チェックアウトの決まり（{h.checkoutTime}まで）より遅い予定です。レイトチェックアウトができるか、宿に確かめておくと安心です。</div>}
            <Field label="予約サイト" opt><SuggestIn value={h.site} onChange={v => setHotel({ site: v })} options={sg.sites} placeholder="Airbnb など" /></Field>
            <Field label="予約番号" opt><TextIn value={h.confirmation} onChange={v => setHotel({ confirmation: v })} /></Field>
            <Field label="無料キャンセル期限" opt><DateIn value={h.cancelDeadline} onChange={v => setHotel({ cancelDeadline: v })} /></Field>
            <Field label="予約ページのURL" opt><TextIn value={h.url} onChange={v => setHotel({ url: v })} inputMode="url" /></Field>
            <Field label="住所" opt wide><PlaceIn value={h.address} onChange={v => setHotel({ address: v, geo: null, addressEnTried: false })} onPick={(r, it) => setHotel({ address: r.address || it.main, geo: llOf(r), addressEnTried: false })} /></Field>
            {(h.nameEn || /[\u3040-\u30ff\u3400-\u9fff]/.test(String(h.name || ""))) && <Field label="英語の名前（入国審査用ページに載せます）" opt wide><TextIn value={h.nameEn || ""} onChange={v => setHotel({ nameEn: v })} placeholder="空なら、しおりを開いたときに自動で調べます" /></Field>}
            {(h.addressEn || /[\u3040-\u30ff\u3400-\u9fff]/.test(String(h.address || ""))) && <Field label="英語の住所（入国審査用ページに載せます）" opt wide><TextIn value={h.addressEn || ""} onChange={v => setHotel({ addressEn: v })} placeholder="空なら、しおりを開いたときに自動で調べます" /></Field>}
          </div>
          <div className="row">
            {safeUrl(h.url) && <a className="btn small" href={safeUrl(h.url)} target="_blank" rel="noopener noreferrer"><Icon n="ext" s={14} />予約ページ</a>}
            {(h.address || s.city) && <a className="btn small" href={`https://www.google.com/maps?q=${encodeURIComponent(h.address || splitCity(s.city).main)}`} target="_blank" rel="noopener noreferrer"><Icon n="pin" s={14} />地図</a>}
          </div>
        </>
      )}
      <div className="formsec" />
      <DeleteButton label="この滞在を削除" onDelete={remove} />
    </>
  );
}

function TransitEditor({ t, id, update, close }) {
  const sg = React.useContext(SuggestCtx);
  const x = transitsOf(t).find(r => r.id === id);
  if (!x) return <p className="empty">この移動は削除されました。</p>;
  const set = (patch) => update(tr => ({ ...tr, itinerary: normalizeItinerary(tr.itinerary.map(r => {
    if (r.id !== id) return r;
    const next = { ...r, ...patch };
    // 飛行機・夜行など遠くへ行く手段に変えたら、「街の中の移動」の印を外す
    if ("mode" in patch && ["飛行機", "夜行列車", "夜行フェリー"].includes(patch.mode)) delete next.local;
    // 会社名から手段を推測（手段が未定のときだけ）
    if ("airline" in patch && (!r.mode || r.mode === "未定")) { const g = guessMode(patch.airline); if (g) next.mode = g; }
    // 到着が出発より前になったら（夜行・時差）、到着日を翌日に
    if (("arriveTime" in patch || "departTime" in patch) && next.departDate && next.departTime && next.arriveTime && (!next.arriveDate || next.arriveDate === next.departDate)) {
      const dep = Date.parse(`${next.departDate}T${next.departTime}:00Z`) - effTZ(next, "depart") * 36e5;
      const arr = Date.parse(`${next.departDate}T${next.arriveTime}:00Z`) - effTZ({ ...next, arriveDate: next.departDate }, "arrive") * 36e5;
      next.arriveDate = arr < dep ? addDays(next.departDate, 1) : next.departDate;
    }
    return next;
  })) }));
  const near = (() => { const sorted = sortItinerary(t.itinerary || []), i = sorted.findIndex(r => r.id === id); const prev = sorted.slice(0, i).reverse().find(r => r.type !== "transit"), nxt = sorted.slice(i + 1).find(r => r.type !== "transit"); return [prev && prev.city, nxt && nxt.city]; })();
  const placeOpts = [...near, ...AIRPORTS, ...sg.cities];
  const mode = x.mode && x.mode !== "未定" ? x.mode : "";
  const remove = () => { update(tr => ({ ...tr, itinerary: tr.itinerary.filter(r => r.id !== id) })); close(); };
  const dur = calcDuration(x);
  const short = SHORT_MODES.includes(x.mode), needs = needsBookingOf(x), booked = isBooked(x.status);
  const tzDiff = effTZ(x, "depart") !== effTZ(x, "arrive") || x.departTZManual || x.arriveTZManual;
  const [showTZ, setShowTZ] = useState(false);
  return (
    <>
      <div className="fgrid">
        <Field label="出発地"><PlaceIn value={x.fromCity} onChange={v => set({ fromCity: v })} onPick={(r, it) => set({ fromCity: r.name || it.main })} options={[...placeOpts, ...sg.addresses]} /></Field>
        <Field label="到着地"><PlaceIn value={x.toCity} onChange={v => set({ toCity: v })} onPick={(r, it) => set({ toCity: r.name || it.main })} options={[near[1], near[0], ...AIRPORTS, ...sg.cities, ...sg.addresses]} /></Field>
        <Field label="手段"><select value={x.mode || "未定"} onChange={e => set({ mode: e.target.value })}>{MODES.map(m => <option key={m}>{m}</option>)}</select></Field>
        <Field label="内容" opt><TextIn value={x.desc} onChange={v => set({ desc: v })} placeholder="例：空港リムジンバス" /></Field>
        {!short && <Field label="会社・便名" opt wide><SuggestIn value={x.airline} onChange={v => set({ airline: v })} options={[...(CARRIERS[mode] || Object.values(CARRIERS).flat()), ...sg.usedCarriers]} placeholder="例：Eurostar 9132" /></Field>}
        <Field label="出発日"><DateIn value={x.departDate} onChange={v => set({ departDate: v, arriveDate: x.arriveDate && x.arriveDate >= v ? x.arriveDate : v })} /></Field>
        <Field label="出発時刻"><TimeIn value={x.departTime} onChange={v => set({ departTime: v })} /></Field>
        <Field label="到着日"><DateIn value={x.arriveDate} onChange={v => set({ arriveDate: v })} /></Field>
        <Field label="到着時刻"><TimeIn value={x.arriveTime} onChange={v => set({ arriveTime: v })} /></Field>
        {(tzDiff || showTZ) ? ["depart", "arrive"].map(side => {
          const key = side === "depart" ? "departTZ" : "arriveTZ", man = side === "depart" ? "departTZManual" : "arriveTZManual", v = effTZ(x, side);
          return (
            <div key={side} className="field">
              <span>{side === "depart" ? "出発地" : "到着地"}の時差 <b className="mono" style={{ color: "var(--ink)" }}>{fmtTZ(v)}</b></span>
              <div className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
                <input type="number" step="0.5" inputMode="decimal" aria-label={`${side === "depart" ? "出発地" : "到着地"}の時差（UTC+）`} value={v} onWheel={e => e.target.blur()} onChange={e => set({ [key]: e.target.value === "" ? 0 : Number(e.target.value), [man]: true })} />
                {x[man] && <button className="btn small" onClick={() => set({ [man]: false })}>自動</button>}
              </div>
              <span className="xs" style={{ color: tzSource(x, side).startsWith("都市名") ? "var(--orange)" : "var(--muted)" }}>{tzSource(x, side)}</span>
            </div>
          );
        }) : <div className="field wide opt"><span>時差<em className="opt-tag">任意</em></span><button className="btn small" style={{ justifySelf: "start" }} onClick={() => setShowTZ(true)}>なし（{fmtTZ(effTZ(x, "depart"))}）・直す</button></div>}
        {!short && <Field label="クラス・席" opt><SuggestIn value={x.cls} onChange={v => set({ cls: v })} options={CLASSES[mode] || CLASSES["飛行機"]} /></Field>}
        {!short && <Field label="経由" opt><PlaceIn value={x.transitStops} onChange={v => set({ transitStops: v })} onPick={(r, it) => set({ transitStops: r.name || it.main })} /></Field>}
        <Field label="金額" opt><MoneyIn t={t} update={update} item={x} onChange={set} /></Field>
        <Field label="人数（金額は何人分か）" opt><select value={x.people || 1} onChange={e => set({ people: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}人</option>)}</select></Field>
        <div className="field"><span>所要時間</span><div className="mono" style={{ padding: "9px 0" }}>{dur || "—"}</div></div>
      </div>
      {FEATURES.ai && isLeg(x) && <><div className="formsec" /><TransitSuggest t={t} x={x} set={set} /></>}
      <div className="formsec">予約</div>
      <Toggle checked={needs || booked} onChange={v => set({ needsBooking: v })}>事前の予約が必要</Toggle>
      {(needs || booked) && <BookingStatus status={x.status} paid={x.paymentStatus} onStatus={v => set({ status: v })} onPaid={v => set({ paymentStatus: v })} />}
      {typeof FEATURES !== "undefined" && typeof FEATURES.transportSearch === "function" && needs && !booked && x.mode !== "飛行機" && inEurope(geoFor(x.fromCity, t.geo)) && inEurope(geoFor(x.toCity, t.geo)) && <AffLink href={FEATURES.transportSearch()} label="Omioで鉄道・バスを探す" copy={[splitCity(x.fromCity).main, splitCity(x.toCity).main].join(" → ") + (x.departDate ? " " + md(x.departDate) : "")} />}
      <Field label="メモ" opt><textarea value={x.memo || ""} onChange={e => set({ memo: e.target.value })} /></Field>
      <div className="formsec" />
      <DeleteButton label="この移動を削除" onDelete={remove} />
    </>
  );
}

function LocalEditor({ t, id, update, close }) {
  const sg = React.useContext(SuggestCtx);
  const [catTouched, setCatTouched] = useState(false);
  const l = (t.localTransport || []).find(r => r.id === id);
  if (!l) return <p className="empty">この予定は削除されました。</p>;
  const set = (patch) => update(tr => ({
    ...tr, localTransport: tr.localTransport.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, ...patch };
      if ("date" in patch) { const s = staysOf(tr).find(s => s.startDate && next.date >= s.startDate && next.date < stayEnd(s)); next.linkedStayId = s ? s.id : null; }
      return next;
    }),
  }));
  const remove = () => { update(tr => ({ ...tr, localTransport: tr.localTransport.filter(r => r.id !== id) })); close(); };
  const isMove = l.category === "移動";
  return (
    <>
      <div className="fgrid">
        <Field label="種類"><select value={l.category || "ツアー"} onChange={e => { setCatTouched(true); set({ category: e.target.value }); }}>{LOCAL_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="日付"><DateIn value={l.date} onChange={v => set({ date: v })} /></Field>
        <Field label="内容" wide><SuggestIn value={l.desc} onChange={v => { const g = catTouched ? "" : guessCategory(v); set(g ? { desc: v, category: g } : { desc: v }); }} options={sg.descs} placeholder="例：サグラダ・ファミリア入場" /></Field>
        <Field label="開始"><TimeIn value={l.startTime} onChange={v => set({ startTime: v })} /></Field>
        <Field label="終了" opt><TimeIn value={l.endTime} onChange={v => set({ endTime: v })} /></Field>
        {isMove ? (
          <>
            <Field label="出発地"><PlaceIn value={l.fromAddress} onChange={v => set({ fromAddress: v })} onPick={(r, it) => set({ fromAddress: r.name || it.main })} options={[...sg.addresses, ...AIRPORTS, ...sg.cities]} /></Field>
            <Field label="到着地"><PlaceIn value={l.toAddress} onChange={v => set({ toAddress: v })} onPick={(r, it) => set({ toAddress: r.name || it.main })} options={[...sg.addresses, ...AIRPORTS, ...sg.cities]} /></Field>
            <Field label="乗り物" opt><SuggestIn value={l.mode} onChange={v => set({ mode: v })} options={["電車", "地下鉄", "バス", "タクシー", "Uber", "徒歩", "船", "レンタカー", "送迎"]} /></Field>
          </>
        ) : (
          <Field label="場所・住所" opt wide><PlaceIn value={l.address} onChange={v => set({ address: v, geo: null })} onPick={(r, it) => set({ address: r.name || it.main, geo: llOf(r) })} options={[...sg.addresses, ...sg.cities]} /></Field>
        )}
        <Field label="金額" opt><MoneyIn t={t} update={update} item={l} onChange={set} /></Field>
        <Field label="人数（金額は何人分か）" opt><select value={l.people || 1} onChange={e => set({ people: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}人</option>)}</select></Field>
      </div>
      <Toggle checked={l.needsBooking} onChange={v => set({ needsBooking: v })}>事前の予約が必要</Toggle>
      <BookingStatus status={l.status || "候補"} paid={l.paymentStatus} onStatus={v => set({ status: v })} onPaid={v => set({ paymentStatus: v })} />
      {typeof FEATURES !== "undefined" && typeof FEATURES.activitySearch === "function" && !isBooked(l.status) && (["ツアー", "入場券", "その他体験"].includes(l.category) || (l.category === "観光" && l.needsBooking)) && (() => { const kw = String(l.address || l.desc || "").replace(/[（(].*?[）)]/g, "").trim(); return kw && <AffLink href={FEATURES.activitySearch(kw)} label={`Klookで「${kw.slice(0, 16)}」を探す`} />; })()}
      <Field label="メモ" opt><textarea value={l.memo || ""} onChange={e => set({ memo: e.target.value })} /></Field>
      <div className="formsec" />
      <DeleteButton label="この予定を削除" onDelete={remove} />
    </>
  );
}

// ================= ホーム =================
// 旅行を作った直後の「はじめの3つ」。終わったものに印がつき、全部終わるか × で閉じると出なくなる
function StartGuide({ t, onTodo, go, onPlanAI, onShare, onHide }) {
  const stay = sortItinerary(staysOf(t)).find(s => isISO(s.startDate) && !s.noHotel);
  const steps = [
    { done: (t.hotels || []).some(h => String(h.name || "").trim()), title: "泊まる宿を入れる", sub: "決まっていなければ、候補の宿でも大丈夫", act: () => stay ? onTodo({ edit: { kind: "stay", id: stay.id } }) : go("plan") },
    { done: (t.localTransport || []).length > 0, title: "行きたい所・予定を入れる", sub: onPlanAI ? "AIに旅行全体の案を出してもらうこともできます" : "日ごとの画面の「追加」から", act: onPlanAI || (() => go("plan")) },
    { done: !!t.startShared, title: "一緒に行く人に送る", sub: "リンクを送るだけ。相手はログインなしで見られます", act: onShare },
  ];
  const left = steps.filter(x => !x.done).length;
  if (!left) return null;
  return (
    <section className="card flush divide" style={{ boxShadow: "0 0 0 1.5px var(--blue)" }}>
      <div className="row between" style={{ padding: "10px 14px", flexWrap: "nowrap" }}><h3>はじめにやること<span className="xs muted" style={{ marginLeft: 8 }}>あと{left}つ</span></h3><button className="iconbtn" aria-label="はじめにやることを閉じる" onClick={onHide}><Icon n="x" s={14} /></button></div>
      {steps.map((x, i) => (
        x.done ? (
          <div key={i} className="todo todo-done">
            <span className="ico blue"><Icon n="check" /></span>
            <span className="t1">{x.title}</span>
            <span className="xs" style={{ color: "var(--blue)" }}>済み</span>
          </div>
        ) : (
        <button key={i} className="todo" onClick={x.act}>
          <span className="ico open"><Icon n={["bed", "ticket", "share"][i]} /></span>
          <span style={{ minWidth: 0 }}><span className="t1">{x.title}</span><span className="t2" style={{ whiteSpace: "normal" }}>{x.sub}</span></span>
          <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><Icon n="down" s={16} /></span>
        </button>
        )
      ))}
    </section>
  );
}
function HomeView({ t, stats, mine, todos, onTodo, inboxCount, scan, onScan, go, openDay, openPhrases, openEmergency, openShiori, openSettings, onExpense, onPlanAI, onShare, onHideGuide }) {
  const r = tripRange(t), today = todayISO();
  const days = r ? dayDiff(today, r.start) : null;
  const sorted = sortItinerary(t.itinerary || []);
  const firstPlace = sorted.length ? splitCity(sorted[0].type === "transit" ? sorted[0].fromCity : sorted[0].city).main : "";
  const last = sorted[sorted.length - 1];
  const lastPlace = last ? splitCity(last.type === "transit" ? last.toCity : last.city).main : "";
  const dot = (iso) => iso ? iso.replace(/-/g, ".") : "—";
  // 上に出す行き先：往復は「東京 ⇄ ソウル」、片道は「東京 → ソウル」、都市が多いときは「ソウルほか2都市」
  const routeLabel = (() => {
    // 空港名は外して都市だけ（「東京・羽田(HND)」→「東京」）
    const town = (x) => String(x || "").split(/[・(（]/)[0].trim();
    const ends = tripEnds(t);
    const home = ends.firstLeg ? town(ends.firstLeg.fromCity) : "";
    const lastPlace = ends.lastLeg ? ends.lastLeg.toCity : "";
    const cs = uniq(staysOf(t).map(s => town(splitCity(s.city).main)).filter(c => c && c !== home));
    const dest = cs.length > 2 ? `${cs[0]}ほか${cs.length - 1}都市` : cs.join("・");
    if (!home) return dest || t.name;
    const end = town(lastPlace);
    if (!dest) return end && end !== home ? `${home} → ${end}` : home;
    return end === home ? `${home} ⇄ ${dest}` : `${home} → ${dest}`;
  })();
  const n = stats.nights, mv = stats.moves;
  return (
    <div className="homegrid">
      <div className="stack h-a">
        <section className="hero">
          {r && days > 0 && <><div className="lbl">出発まで</div><div className="row" style={{ alignItems: "baseline", gap: 6 }}><span className="big">{days}</span><span style={{ fontSize: 16 }}>日</span></div></>}
          {r && days <= 0 && dayDiff(today, r.end) >= 0 && <><div className="lbl">旅行中</div><div className="row" style={{ alignItems: "baseline", gap: 6 }}><span className="big">{1 - days}</span><span style={{ fontSize: 16 }}>日目</span></div></>}
          {r && dayDiff(today, r.end) < 0 && <><div className="lbl">この旅行は</div><div style={{ fontSize: 22, fontWeight: 700 }}>終わりました</div></>}
          {!r && <><div className="lbl">{t.name}</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>まだ日程がありません</div><button className="btn small" style={{ marginTop: 12 }} onClick={() => go("plan")}>旅程を作る</button></>}
          {r && (
            <>
              <div className="route2">{routeLabel}</div>
              <div className="small mono" style={{ marginTop: 6, color: "#B9C2CC" }}>{dot(r.start)} 〜 {md(r.end)} ・ {r.days}日間</div>
            </>
          )}
        </section>
        {t.startGuide && !t.startGuideOff && (!r || days > 0) && onShare && <StartGuide t={t} onTodo={onTodo} go={go} onPlanAI={onPlanAI} onShare={onShare} onHide={onHideGuide} />}
        {r && days <= 0 && dayDiff(today, r.end) >= 0 && (
          <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12 }} onClick={() => openDay(today)}>
            <span className="ico blue"><Icon n="clock" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t1">今日の予定</span><span className="t2">{md(today)}（{wdOf(today)}）の動きを時刻順に見る</span></span>
            <Icon n="down" s={16} />
          </button>
        )}
        {r && onPlanAI && today < r.start && (t.localTransport || []).length < 3 && !(t.startGuide && !t.startGuideOff && !(t.localTransport || []).length) && (
          <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12, boxShadow: "0 0 0 1.5px var(--blue)" }} onClick={onPlanAI}>
            <span className="ico blue"><Icon n="star" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t1">予定の案をAIに出してもらう</span><span className="t2" style={{ whiteSpace: "normal" }}>{(t.scenes || []).length ? `${t.scenes.join("・")}の旅に合わせて、` : ""}いつもの ChatGPT・Claude・Gemini・Muse に聞いて、答えをそのまま取り込めます</span></span>
            <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><Icon n="down" s={16} /></span>
          </button>
        )}
        {r && onExpense && today >= r.start && today <= r.end && (
          <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12, boxShadow: "0 0 0 1.5px var(--blue)" }} onClick={onExpense}>
            <span className="ico blue"><Icon n="wallet" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t1">支出を記録</span><span className="t2" style={{ whiteSpace: "normal" }}>ごはん・交通・お土産など、使ったお金をその場で</span></span>
            <Icon n="plus" s={16} />
          </button>
        )}
        <section>
          <div className="sechead"><h2>今やること</h2></div>
          <div className="card flush divide">
            {todos.length === 0 && <p className="empty">今やることはありません。</p>}
            {todos.map((td, i) => (
              <React.Fragment key={i}>
                <button className="todo" onClick={() => onTodo(td)}>
                  <span className={"ico " + (td.urgent ? "urgent" : td.icon === "mail" ? "blue" : "open")}><Icon n={td.icon} /></span>
                  <span style={{ minWidth: 0 }}><span className="t1">{td.title}</span><span className="t2">{td.sub}</span></span>
                  <span className={"pill " + (td.urgent ? "tone-open" : "tone-none")}>{td.tag}</span>
                </button>
                {td.city && typeof FEATURES !== "undefined" && typeof FEATURES.hotelSearch === "function" && (
                  <div className="row small" style={{ padding: "0 14px 10px 62px", gap: 8, alignItems: "center", borderTop: "none" }}>
                    <a href={FEATURES.hotelSearch(td.city)} target="_blank" rel="noopener sponsored" onClick={() => track("affiliate_click", { partner: "agoda", place: "home" })}>アゴダで{td.city}の宿を探す</a>
                    <span className="xs muted" style={{ border: "1px solid var(--line)", borderRadius: 4, padding: "0 4px" }}>PR</span>
                    <span className="xs muted">料金は変わりません</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
        {typeof HomeClimate === "function" && <HomeClimate t={t} />}
        {r && r.days <= 10 && (
          <section className="card flush divide">
            <div className="row" style={{ padding: "12px 14px", justifyContent: "space-between", alignItems: "center" }}><h3>日程</h3>{openSettings && <button className="btn small" onClick={openSettings}>日程をずらす</button>}</div>
            {Array.from({ length: r.days }, (_, i) => addDays(r.start, i)).map((d, i) => {
              const { ev, head } = dayEvents(t, d);
              const first = ev.find(e => e.time);
              return (
                <button key={d} className="bookrow" style={{ gridTemplateColumns: "64px minmax(0,1fr) auto", minHeight: 52, padding: "8px 14px" }} onClick={() => openDay(d)}>
                  <span className="mono"><b style={{ display: "block" }}>{md(d)}</b><span className="xs muted">{i + 1}日目・{wdOf(d)}</span></span>
                  <span style={{ minWidth: 0 }}><span className="t1">{head}</span><span className="t2">{ev.length ? `${ev.length}件の予定${first ? `（${first.time.slice(0, 5)} ${first.title}〜）` : ""}` : "予定なし"}</span></span>
                  <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><Icon n="down" s={16} /></span>
                </button>
              );
            })}
          </section>
        )}
        {r && (
          <div className="statgrid">
            <div className="card">
              <div className="row between"><span className="small muted">宿</span><span className="mono small muted">{n.total}泊</span></div>
              <div className="bar">{n.booked > 0 && <span style={{ flex: n.booked, background: "var(--blue)" }} />}{n.open > 0 && <span style={{ flex: n.open, background: "var(--orange-bar)" }} />}{n.none > 0 && <span style={{ flex: n.none, background: "#B5BAB3" }} />}</div>
              <div className="legend">{n.open === 0 && n.booked > 0 ? <span style={{ color: "var(--blue)" }}>✓ すべて予約済み</span> : <>{n.booked > 0 && <span><b style={{ color: "var(--blue)" }}>{n.booked}</b> 予約済み</span>}{n.open > 0 && <span><b style={{ color: "var(--orange)" }}>{n.open}</b> 未手配</span>}</>}{n.none > 0 && <span><b className="muted">{n.none}</b> 宿不要</span>}</div>
            </div>
            <div className="card">
              <div className="row between"><span className="small muted">都市間の移動</span><span className="mono small muted">{mv.total}区間</span></div>
              <div className="bar">{mv.booked > 0 && <span style={{ flex: mv.booked, background: "var(--blue)" }} />}{mv.decided > 0 && <span style={{ flex: mv.decided, background: "var(--orange-bar)" }} />}{mv.unknown > 0 && <span style={{ flex: mv.unknown, background: "repeating-linear-gradient(45deg,#E8892B 0 3px,#FDEBD3 3px 6px)" }} />}</div>
              <div className="legend">{mv.decided + mv.unknown === 0 && mv.booked > 0 ? <span style={{ color: "var(--blue)" }}>✓ すべて予約済み</span> : <>{mv.booked > 0 && <span><b style={{ color: "var(--blue)" }}>{mv.booked}</b> 予約済み</span>}{mv.decided > 0 && <span><b style={{ color: "var(--orange)" }}>{mv.decided}</b> 未予約</span>}{mv.unknown > 0 && <span><b style={{ color: "var(--orange)" }}>{mv.unknown}</b> 手段未定</span>}</>}{mv.total === 0 && <span className="muted">まだありません</span>}</div>
            </div>
          </div>
        )}
      </div>
      <div className="stack h-c">
        {!(t.totalBudget || mine.total) ? (
          <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12 }} onClick={() => go("money")}>
            <span className="ico" style={{ background: "var(--sunk)", color: "var(--ink)" }}><Icon n="wallet" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t1">お金</span><span className="t2" style={{ whiteSpace: "normal" }}>宿や移動に金額を入れると、1人分の見込みがここに出ます。予算も決められます</span></span>
            <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><Icon n="down" s={16} /></span>
          </button>
        ) : <section>
          <div className="sechead"><h2>お金</h2><span className="small muted">予算（1人分） <b className="mono" style={{ color: "var(--ink)" }}>{yen(t.totalBudget)}</b></span></div>
          <button className="card" style={{ width: "100%", textAlign: "left", border: 0 }} onClick={() => go("money")}>
            <div className="row between"><span className="small muted">今の見込み（1人分）</span><span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{yen(mine.total)}</span></div>
            <div className="bar" style={{ height: 10 }}>
              {[[mine.hotel, "var(--ink)"], [mine.flight, "var(--muted)"], [mine.localTransport + mine.localActivity, "#9AA3AC"]].map(([v, c], i) => v > 0 && <span key={i} style={{ width: `${Math.min(100, v / Math.max(t.totalBudget || 0, mine.total) * 100)}%`, background: c }} />)}
            </div>
            <div className="fgrid small" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
              <div><div className="muted">宿</div><div className="mono">{yen(mine.hotel)}</div></div>
              <div><div className="muted">移動</div><div className="mono">{yen(mine.flight)}</div></div>
              <div><div className="muted">現地</div><div className="mono">{yen(mine.localTransport + mine.localActivity)}</div></div>
            </div>
            <div className="small muted" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--sunk)" }}>
              {t.totalBudget > 0 && <>残り予算 <b className={"mono" + (t.totalBudget - mine.total < 0 ? " over" : "")} style={{ color: t.totalBudget - mine.total < 0 ? undefined : "var(--ink)" }}>{yen(t.totalBudget - mine.total)}</b> ・ </>}
              {mine.paid !== null && <>支払い済み <b className="mono" style={{ color: "var(--ink)" }}>{yen(mine.paid)}</b> ・ </>}全員分の合計 <span className="mono">{yen(stats.estimate)}</span>
            </div>
          </button>
        </section>}
      </div>
      <div className="stack h-b">
        {r && (() => {
          // 出発の2週間前から旅行中は「オフライン用に保存」を目立たせる。それ以外はふつうの入口
          const soon = (days > 0 && days <= 14) || (days <= 0 && dayDiff(today, r.end) >= 0);
          return (
            <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12, boxShadow: soon ? "0 0 0 1.5px var(--blue)" : undefined }} onClick={openShiori}>
              <span className="ico blue"><Icon n="ext" /></span>
              <span style={{ flex: 1, minWidth: 0 }}><span className="t1">{soon ? "オフライン用にしおりを保存" : "旅のしおり"}</span><span className="t2" style={{ whiteSpace: "normal" }}>{soon ? "電波がない所でも見られるよう、PDFをスマホに保存しておきましょう" : "搭乗券のデザインのしおりを、PDFで保存・印刷"}</span></span>
              {!soon && <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><Icon n="down" s={16} /></span>}
            </button>
          );
        })()}
        {tripCountries(t).length > 0 && (
          <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12 }} onClick={openEmergency}>
            <span className="ico" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}><Icon n="clock" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t1">緊急時の情報</span><span className="t2">{(t.emergencyCountries || []).length ? "緊急番号・日本大使館・保険の連絡先" : "緊急番号や大使館、保険の連絡先をまとめる"}</span></span>
            <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><Icon n="down" s={16} /></span>
          </button>
        )}
        {tripLanguages(t).length > 0 && (
          <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12 }} onClick={openPhrases}>
            <span className="ico blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></svg></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t1">旅のフレーズ集</span><span className="t2">{tripLanguages(t).map(l => l.lang).join("・")}</span></span>
            <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><Icon n="down" s={16} /></span>
          </button>
        )}
        {typeof FEATURES.articleFor === "function" && (() => { const ar = FEATURES.articleFor(t); return ar && (
          <a className="card row" style={{ width: "100%", textAlign: "left", flexWrap: "nowrap", gap: 12, color: "inherit", textDecoration: "none" }} href={ar.url} target="_blank" rel="noopener" onClick={() => track("article_click", { place: "home" })}>
            <span className="ico" style={{ background: "var(--sunk)", color: "var(--ink)" }}><Icon n="pencil" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t2">読みもの</span><span className="t1" style={{ whiteSpace: "normal" }}>{ar.title}</span></span>
            <Icon n="ext" s={16} />
          </a>
        ); })()}
        {FEATURES.mail && <section className="card row" style={{ flexWrap: "nowrap", gap: 12 }}>
          <span className="ico blue"><Icon n="mail" /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="t1">予約メール</span>
            <span className="t2" style={{ whiteSpace: "normal" }}>{scan.msg || (inboxCount ? `取り込み候補が${inboxCount}件あります` : t.gmailLabel ? `ラベル「${t.gmailLabel}」のメールを読みます` : "Gmailの予約メールを読み取ります")}</span>
          </span>
          {inboxCount > 0
            ? <button className="btn small primary" onClick={() => go("book")}>確認する</button>
            : <button className="btn small" disabled={scan.st === "busy"} onClick={onScan}>{scan.st === "busy" ? "読み取り中…" : "Gmailを確認"}</button>}
        </section>}
      </div>
    </div>
  );
}

// ================= 旅程 =================
function StayRow({ t, s, onEdit }) {
  const st = stayState(t, s), h = hotelOf(t, s), c = splitCity(s.city);
  const sub = s.noHotel ? [c.note, s.memo].filter(Boolean).join(" ・ ") || st.label : h && h.name ? h.name + (h.site ? `（${h.site}）` : "") : "宿未定";
  const subColor = !s.noHotel && !(h && h.name) ? "var(--orange)" : "var(--muted)";
  return (
    <li><button className="stayrow" onClick={() => onEdit({ kind: "stay", id: s.id })}>
      <div className="datecol"><b>{md(s.startDate) || "—"}</b><span>{wdOf(s.startDate)}</span></div>
      <div style={{ minWidth: 0 }}>
        <div className="row" style={{ flexWrap: "nowrap", gap: 6, alignItems: "baseline" }}><span className="city">{c.main || "（都市未入力）"}</span><span className="mono small muted" style={{ whiteSpace: "nowrap" }}>{nightsOf(s)}泊</span></div>
        <div className="small" style={{ color: subColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      <div style={{ textAlign: "right" }}><Pill st={st} />{h && Number(h.total) > 0 && !s.noHotel && <div className="mono small muted" style={{ marginTop: 4 }}>{yen(h.total)}</div>}</div>
    </button></li>
  );
}
function MoveRow({ x, onEdit }) {
  const st = transitState(x), dur = calcDuration(x);
  const detail = x.departTime ? `${md(x.departDate)} ${x.departTime} → ${x.arriveDate && x.arriveDate !== x.departDate ? md(x.arriveDate) + " " : ""}${x.arriveTime || "?"}${dur ? " ・ " + dur : ""}` : `${md(x.departDate)} ・ 時刻未定`;
  return (
    <li><button className="moverow" onClick={() => onEdit({ kind: "transit", id: x.id })}>
      <div className="rail"><span className={"mico" + (st.key === "unknown" ? " unknown" : "")}><Icon n={modeIcon(x.mode)} s={15} /></span></div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{moveTitle(x)}</div>
        <div className="mono muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail}{x.airline ? ` ・ ${x.airline}` : ""}</div>
      </div>
      <div className={"mstatus " + st.tone}>{st.label}{Number(x.price) > 0 && <div className="mono muted" style={{ fontWeight: 400 }}>{yen(x.price)}</div>}</div>
    </button></li>
  );
}
function ListView({ t, onEdit, onlyOpen }) {
  let rows = sortItinerary(t.itinerary || []);
  if (onlyOpen) rows = rows.filter(r => isOpenState(r.type === "transit" ? transitState(r) : stayState(t, r)));
  else rows = rows.filter(r => r.type !== "transit" || isLeg(r) || isOpenState(transitState(r))); // 街の中の移動は日ごとの表示で
  if (!rows.length) return <p className="empty card">{onlyOpen ? "未手配のものはありません。" : "まだ予定がありません。右上の「追加」から滞在や移動を入れてください。"}</p>;
  return <ol className="itin">{rows.map(r => r.type === "transit" ? <MoveRow key={r.id} x={r} onEdit={onEdit} /> : <StayRow key={r.id} t={t} s={r} onEdit={onEdit} />)}</ol>;
}
function MonthView({ t, onEdit }) {
  const r = tripRange(t);
  if (!r) return <p className="empty card">日付の入った予定がまだありません。</p>;
  const today = todayISO();
  const bands = [];
  staysOf(t).filter(s => isISO(s.startDate)).forEach(s => {
    const st = stayState(t, s), h = hotelOf(t, s), c = splitCity(s.city);
    bands.push({ start: s.startDate, n: Math.max(1, nightsOf(s)), label: c.main || "都市未入力", nights: nightsOf(s), sub: s.noHotel ? st.label : h && h.name ? h.name : st.key === "cand" ? "候補あり" : "宿未定", cls: st.tone, edit: { kind: "stay", id: s.id } });
  });
  transitsOf(t).filter(x => isLeg(x) && isISO(x.departDate) && isISO(x.arriveDate) && x.arriveDate > x.departDate).forEach(x => {
    bands.push({ start: x.departDate, n: 1, label: x.mode === "飛行機" ? "機内泊" : (x.mode || "").includes("フェリー") ? "船中泊" : "車中泊", sub: `${splitCity(x.fromCity).main}→${splitCity(x.toCity).main}`, cls: "night", edit: { kind: "transit", id: x.id } });
  });
  const moves = {};
  transitsOf(t).filter(x => isLeg(x) && isISO(x.departDate)).forEach(x => { moves[x.departDate] = transitState(x).key === "unknown" && !moves[x.departDate] ? "unknown" : modeIcon(x.mode); });
  const months = [];
  for (let y = +r.start.slice(0, 4), m = +r.start.slice(5, 7); y * 12 + m <= +r.end.slice(0, 4) * 12 + +r.end.slice(5, 7); m === 12 ? (y++, m = 1) : m++) months.push([y, m]);
  return (
    <div className="stack">
      <div className="legendrow">
        <span><i className="sw" style={{ background: "var(--blue-band)" }} />宿 予約済み</span>
        <span><i className="sw" style={{ background: "repeating-linear-gradient(135deg,#FDEBD3 0 4px,#F6C996 4px 7px)" }} />宿 未手配</span>
        <span><i className="sw" style={{ background: "var(--sunk2)" }} />宿不要</span>
        <span><i className="sw" style={{ outline: "1px dashed var(--faint)", outlineOffset: -1, background: "#fff" }} />車中・機内泊</span>
      </div>
      <div className="months">
        {months.map(([y, m]) => {
          const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
          const weeks = [];
          for (let w = 0; w * 7 - lead < dim; w++) {
            const cells = [];
            for (let c = 0; c < 7; c++) { const d = w * 7 + c - lead + 1; cells.push(d >= 1 && d <= dim ? `${y}-${pad(m)}-${pad(d)}` : null); }
            weeks.push(cells);
          }
          return (
            <section key={`${y}-${m}`} className="month">
              <h3 className="mono" style={{ fontFamily: "var(--f-mono)", marginBottom: 8 }}>{y}.{pad(m)}</h3>
              <div className="wdays">{[...WD].map(d => <span key={d}>{d}</span>)}</div>
              {weeks.map((cells, wi) => (
                <div key={wi} className="week">
                  {cells.map((iso, ci) => {
                    const inTrip = iso && iso >= r.start && iso <= r.end, mv = iso && moves[iso];
                    return (
                      <div key={ci} className={"dcell" + (inTrip ? "" : " out") + (iso === today ? " today" : "")} style={{ gridColumn: ci + 1 }}>
                        <span className="n">{iso ? Number(iso.slice(8)) : ""}</span>
                        {mv && <span className={"mdot" + (mv === "unknown" ? " unknown" : "")} title={mv === "unknown" ? "移動手段が未定" : "移動日"}><Icon n={mv === "unknown" ? "question" : mv} s={10} w={2.6} /></span>}
                      </div>
                    );
                  })}
                  {bands.map((b, bi) => {
                    const s = dayNum(b.start), e = s + b.n - 1;
                    const idx = cells.map((iso, ci) => iso && dayNum(iso) >= s && dayNum(iso) <= e ? ci : -1).filter(ci => ci >= 0);
                    if (!idx.length) return null;
                    const first = dayNum(cells[idx[0]]) === s, lastSeg = dayNum(cells[idx[idx.length - 1]]) === e;
                    const rad = `${first ? 8 : 0}px ${lastSeg ? 8 : 0}px ${lastSeg ? 8 : 0}px ${first ? 8 : 0}px`;
                    return (
                      <button key={bi} className={"band " + b.cls} style={{ gridColumn: `${idx[0] + 1} / span ${idx.length}`, borderRadius: rad }} onClick={() => onEdit(b.edit)} title={`${b.label} ${b.sub}`}>
                        <b>{first ? b.label + (b.nights ? ` ${b.nights}泊` : "") : `${b.label}（続き）`}</b>
                        {(idx.length >= 2 || b.cls === "night") && <small>{b.sub}</small>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
// DAY 1 / DAY 2 … のタブ。押した日だけを表示する。数が多いときは横にスクロール
function DayTabs({ days, sel, setSel, today }) {
  const ref = useRef(null);
  useEffect(() => { const el = ref.current && ref.current.querySelector('[aria-selected="true"]'); if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "center" }); }, [sel]);
  return (
    <div className="daytabs" role="tablist" aria-label="日付" ref={ref}>
      {days.map((d, i) => (
        <button key={d} role="tab" aria-selected={d === sel} className={"daytab" + (d === today ? " today" : "")} onClick={() => setSel(d)}>
          <b>DAY {i + 1}</b><span>{md(d)}（{wdOf(d)}）</span>
        </button>
      ))}
    </div>
  );
}
// 最初に開く日：旅行中なら今日、そうでなければ1日目
const firstDay = (r) => { const today = todayISO(); return r ? (today >= r.start && today <= r.end ? today : r.start) : null; };
// ===== 行きたいところ（日付を決めずに置いておくリスト） =====
// t.wishlist = [{ id, title, address, geo, memo, len: "1h"|"half"|"day"|"", needsBooking }]
const WISH_LEN = { "1h": "1時間ほど", half: "半日", day: "1日がかり" };
function WishList({ t, update }) {
  const list = t.wishlist || [];
  const [open, setOpen] = useState(list.length > 0);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const save = () => {
    const title = String(form.title || "").trim();
    if (!title) return;
    const item = { id: form.id || uid(), title, address: form.address || "", geo: form.geo || null, memo: form.memo || "", len: form.len || "", needsBooking: !!form.needsBooking };
    update(tr => { const cur = tr.wishlist || []; return { ...tr, wishlist: cur.some(x => x.id === item.id) ? cur.map(x => x.id === item.id ? item : x) : [...cur, item] }; });
    setForm(null); setEditId(null);
  };
  const remove = (id) => update(tr => ({ ...tr, wishlist: (tr.wishlist || []).filter(x => x.id !== id) }));
  const editor = (
    <div className="stack" style={{ gap: 8, background: "var(--sunk)", borderRadius: 12, padding: 12 }}>
      <div className="fgrid">
        <Field label="行きたいところ・やりたいこと" wide><TextIn value={form ? form.title : ""} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="例：USJ、道頓堀で食べ歩き" /></Field>
        <Field label="場所" opt wide><PlaceIn value={form ? form.address : ""} onChange={v => setForm(f => ({ ...f, address: v, geo: null }))} onPick={(r, it) => setForm(f => ({ ...f, address: r.name || it.main, geo: llOf(r) }))} /></Field>
        <Field label="かかる時間の目安" opt><select value={form ? form.len : ""} onChange={e => setForm(f => ({ ...f, len: e.target.value }))}><option value="">決めない</option>{Object.entries(WISH_LEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="メモ" opt><TextIn value={form ? form.memo : ""} onChange={v => setForm(f => ({ ...f, memo: v }))} placeholder="例：平日の方が空いている" /></Field>
      </div>
      <label className="row small" style={{ gap: 8 }}><input type="checkbox" checked={!!(form && form.needsBooking)} onChange={e => setForm(f => ({ ...f, needsBooking: e.target.checked }))} />予約やチケットが必要（日付が決まる前でも「今やること」に出します）</label>
      <div className="row"><button className="btn primary small" disabled={!form || !String(form.title || "").trim()} onClick={save}>{form && form.id ? "保存" : "リストに入れる"}</button><button className="btn small ghost" onClick={() => { setForm(null); setEditId(null); }}>やめる</button></div>
    </div>
  );
  return (
    <section className="card stack" style={{ gap: 8 }}>
      <button className="row between" style={{ border: 0, background: "none", padding: 0, width: "100%", textAlign: "left", cursor: "pointer", flexWrap: "nowrap" }} aria-expanded={open} onClick={() => setOpen(!open)}>
        <span><b>行きたいところ</b><span className="xs muted" style={{ marginLeft: 8 }}>{list.length ? `${list.length}件 ・ まだ日を決めていないもの` : "日を決めずに置いておけます"}</span></span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", display: "inline-flex" }}><Icon n="down" s={16} /></span>
      </button>
      {open && <>
        {list.length === 0 && !form && <p className="xs muted" style={{ margin: 0 }}>「USJ には絶対行きたいけど、何日目かはまだ」のようなものを入れておき、各日の「行きたいところから」でその日に入れられます。</p>}
        <div className="divide">
          {list.map(w => editId === w.id ? <div key={w.id} style={{ padding: "6px 0" }}>{editor}</div> : (
            <div key={w.id} className="row between" style={{ flexWrap: "nowrap", padding: "8px 0", gap: 8 }}>
              <button style={{ minWidth: 0, flex: 1, textAlign: "left", background: "none", border: 0, padding: 0, color: "inherit", cursor: "pointer" }} onClick={() => { setForm({ ...w }); setEditId(w.id); }}>
                <span className="t1">{w.title}</span>
                <span className="xs muted">{[w.address, WISH_LEN[w.len], w.memo].filter(Boolean).join(" ・ ")}</span>
                {w.needsBooking && <span className="pill tone-open" style={{ marginTop: 4 }}><i />予約が必要</span>}
              </button>
              <button className="iconbtn" aria-label={`${w.title}をリストから外す`} onClick={() => remove(w.id)}><Icon n="x" s={14} /></button>
            </div>
          ))}
        </div>
        {form && !editId ? editor : !form && <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => setForm({ title: "", address: "", memo: "", len: "", needsBooking: false })}><Icon n="plus" s={14} />行きたいところを入れる</button>}
      </>}
    </section>
  );
}
// その日に入れる：行きたいところを選ぶと、その日の予定（時刻は未定）に移す
function WishPicker({ t, iso, update, done }) {
  const list = t.wishlist || [];
  const move = (w) => {
    const stay = staysOf(t).find(s => s.startDate && iso >= s.startDate && iso < stayEnd(s));
    const l = { id: uid(), linkedStayId: stay ? stay.id : null, category: "観光", desc: w.title, address: w.address || "", geo: w.geo || null, fromAddress: "", toAddress: "", date: iso, startTime: "", endTime: "", mode: "", price: 0, people: 1, needsBooking: !!w.needsBooking, memo: [WISH_LEN[w.len], w.memo].filter(Boolean).join(" ・ "), paymentStatus: "未払い", status: "候補" };
    update(tr => ({ ...tr, localTransport: [...(tr.localTransport || []), l], wishlist: (tr.wishlist || []).filter(x => x.id !== w.id) }));
    done(w.title);
  };
  if (!list.length) return <p className="empty">行きたいところはまだありません。旅程の「日ごと」の画面の上にある「行きたいところ」から入れられます。</p>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p className="small muted" style={{ margin: 0 }}>{md(iso)}（{wdOf(iso)}）に入れるものを選んでください。時刻はあとから決められます。</p>
      <div className="card flush divide">
        {list.map(w => (
          <button key={w.id} className="bookrow" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }} onClick={() => move(w)}>
            <span style={{ minWidth: 0 }}><span className="t1">{w.title}</span><span className="t2">{[w.address, WISH_LEN[w.len], w.needsBooking ? "予約が必要" : ""].filter(Boolean).join(" ・ ")}</span></span>
            <span className="btn small">この日に入れる</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function DayView({ t, onEdit, onAddLocal, onAddMove, onSuggest, update, onWish }) {
  const r = tripRange(t);
  const [sel, setSel] = useState(() => (window.__demo && window.__demo.day) || firstDay(r));
  useEffect(() => { if (r && (!sel || sel < r.start || sel > r.end)) setSel(firstDay(r)); }, [r && r.start, r && r.end]);
  if (!r) return <p className="empty card">日付の入った予定がまだありません。右上の「追加」から滞在を入れてください。</p>;
  const today = todayISO();
  const days = [];
  for (let d = r.start; d <= r.end; d = addDays(d, 1)) days.push(d);
  const cur = sel && sel >= r.start && sel <= r.end ? sel : days[0];
  return (
    <div className="stack">
      {update && <WishList t={t} update={update} />}
      <DayTabs days={days} sel={cur} setSel={setSel} today={today} />
      {days.map((d, i) => d !== cur ? null : (() => {
        const { head } = dayEvents(t, d);
        return (
          <section key={d} className="card flush divide" style={d === today ? { boxShadow: "0 0 0 2px var(--blue)" } : undefined}>
            <div className="row between" style={{ padding: "12px 14px", flexWrap: "wrap", rowGap: 8 }}>
              <span style={{ minWidth: 0, flex: "1 1 160px" }}>
                <span className="mono xs muted" style={{ whiteSpace: "nowrap" }}>{i + 1}日目 ・ {md(d)}（{wdOf(d)}）{d === today ? " ・ 今日" : ""}</span>
                <span style={{ display: "block", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 17 }}>{head}</span>
              </span>
              <span className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                {onSuggest && <button className="btn small" onClick={() => onSuggest(d)}>{FEATURES.ai ? "提案" : "AIに相談"}</button>}
                {onWish && (t.wishlist || []).length > 0 && <button className="btn small" onClick={() => onWish(d)}>行きたいところから</button>}
                <button className="btn small" onClick={() => onAddLocal(d)}><Icon n="plus" s={14} />追加</button>
              </span>
            </div>
            {typeof DayWeather === "function" && <DayWeather t={t} iso={d} />}
            <DayTimeline t={t} iso={d} onEdit={onEdit} onInsert={(k, o) => k === "move" ? onAddMove(d, o) : onAddLocal(d, o)} />
          </section>
        );
      })())}
      {cur && <DayMap t={t} iso={cur} />}
    </div>
  );
}
function MapView({ t, onPick, onGuess, guessing }) {
  const stays = sortItinerary(staysOf(t)).filter(s => s.city);
  if (!stays.length) return <p className="empty card">まだ滞在先がありません。</p>;
  const names = stays.map(s => splitCity(s.city).main);
  const route = `https://www.google.com/maps/dir/${names.map(encodeURIComponent).join("/")}`;
  const unknown = unknownPlaces(t);
  return (
    <div className="stack">
      <section className="card stack" style={{ gap: 10, padding: 10 }}>
        <RouteMap t={t} onPick={onPick ? (s) => onPick({ kind: "stay", id: s.id }) : null} />
        <MapLegend />
        {unknown.length > 0 && (
          <div className="row between note" style={{ flexWrap: "nowrap" }}>
            <span style={{ minWidth: 0 }}>位置が分からず地図に出ていない場所：{unknown.join("・")}</span>
            {onGuess && FEATURES.ai ? <button className="btn small" disabled={guessing} onClick={onGuess}>{guessing ? "推測中…" : "Claudeで位置を推測"}</button>
              : !FEATURES.ai && <span className="xs muted">都市や場所の欄で Google の候補から選び直すと、地図に出ます</span>}
          </div>
        )}
      </section>
      <a className="btn primary block" href={route} target="_blank" rel="noopener noreferrer"><Icon n="map" s={16} />ルート全体をGoogleマップで開く（{names.length}都市）</a>
      <div className="card flush divide">
        {stays.map(s => {
          const h = hotelOf(t, s), q = h && h.address ? h.address : splitCity(s.city).main;
          return (
            <a key={s.id} className="bookrow" href={`https://www.google.com/maps?q=${encodeURIComponent(q)}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink)", textDecoration: "none" }}>
              <span className="ico open" style={{ background: "var(--sunk)", color: "var(--ink)" }}><Icon n="pin" /></span>
              <span style={{ minWidth: 0 }}><span className="t1">{splitCity(s.city).main}</span><span className="t2">{h && h.address ? h.address : `${md(s.startDate)}〜${md(stayEnd(s))}`}</span></span>
              <Icon n="ext" s={16} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
function PlanView({ t, view, setView, onEdit, onAdd, onAddStay, onAddLocal, onAddMove, onGuessGeo, guessing, onSuggest, update, onWish }) {
  const [onlyOpen, setOnlyOpen] = useState(false);
  const openCount = (t.itinerary || []).filter(r => isOpenState(r.type === "transit" ? transitState(r) : stayState(t, r))).length;
  return (
    <div className="stack">
      <div className="row between" style={{ marginTop: 4 }}><h1>旅程</h1>{view !== "day" && <button className="btn primary" onClick={onAdd}><Icon n="plus" s={16} />追加</button>}</div>
      <div className="seg" role="tablist" aria-label="表示の切り替え">
        {[["day", "日ごと"], ["list", "リスト"], ["month", "月"], ["map", "地図"]].map(([k, l]) => <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}>{l}</button>)}
      </div>
      {view === "list" && (
        <div className="chips">
          <button className="chip" aria-pressed={!onlyOpen} onClick={() => setOnlyOpen(false)}>すべて</button>
          <button className="chip" aria-pressed={onlyOpen} onClick={() => setOnlyOpen(true)}>未手配だけ <b style={{ color: onlyOpen ? undefined : "var(--orange)" }}>{openCount}</b></button>
        </div>
      )}
      {view === "list" && <ListView t={t} onEdit={onEdit} onlyOpen={onlyOpen} />}
      {view === "month" && <MonthView t={t} onEdit={onEdit} />}
      {view === "day" && <DayView t={t} onEdit={onEdit} onAddLocal={onAddLocal} onAddMove={onAddMove} onSuggest={onSuggest} update={update} onWish={onWish} />}
      {view === "map" && <MapView t={t} onPick={onEdit} onGuess={onGuessGeo} guessing={guessing} />}
    </div>
  );
}

// その日の動き：チェックアウト → 移動 → 現地の予定 → チェックイン を時刻順に
function dayEvents(t, iso) {
  const stays = staysOf(t).filter(s => isISO(s.startDate));
  const ending = stays.find(s => stayEnd(s) === iso), starting = stays.find(s => s.startDate === iso);
  const sleeping = stays.find(s => iso >= s.startDate && iso < stayEnd(s));
  const ev = [];
  // 宿の時刻：行く予定の時刻（planCheckin / planCheckout）があればそれを、なければ宿の決まりの時刻を薄く出す
  if (ending && !ending.noHotel) {
    const h = hotelOf(t, ending) || {}, tm = h.planCheckout || h.checkoutTime;
    const note = !h.planCheckout && h.checkoutTime ? `${h.checkoutTime}までに（宿の決まり）` : h.planCheckout && h.checkoutTime && h.planCheckout > h.checkoutTime ? `決まりは${h.checkoutTime}まで。レイトチェックアウトを確かめておく` : "";
    ev.push({ at: [[h.address, h.name]], ll: h.geo || null, k: tm || "10:00", co: !tm, time: tm, rule: !h.planCheckout && !!h.checkoutTime, icon: "bed", title: "チェックアウト", sub: [h.name || `${splitCity(ending.city).main}の宿`, note].filter(Boolean).join(" ・ "), warn: !!(h.planCheckout && h.checkoutTime && h.planCheckout > h.checkoutTime), edit: { kind: "stay", id: ending.id } });
  }
  transitsOf(t).forEach(x => {
    const from = splitCity(x.fromCity).main, to = splitCity(x.toCity).main, dur = calcDuration(x), st = transitState(x);
    if (!isLeg(x)) {
      // 街の中の移動は1行で（出発〜到着）
      if (x.departDate === iso) ev.push({ at: [[x.fromCity], [x.toCity]], mv: modeColor(x.mode), k: x.departTime || "13:00", time: x.departTime ? x.departTime + (x.arriveTime ? `〜${x.arriveTime}` : "") : "", icon: modeIcon(x.mode), title: moveTitle(x), sub: [x.mode !== "未定" && x.mode, from && to && x.desc, x.airline, dur].filter(Boolean).join(" ・ "), st, edit: { kind: "transit", id: x.id } });
      return;
    }
    if (x.departDate === iso) {
      // 同じ日に着く移動は1行にまとめる（「08:55〜11:25」）。翌日以降に着くなら、着く日に「着」の行を出す
      const sameDay = !x.arriveDate || x.arriveDate === iso;
      const arr = x.arriveTime && !sameDay ? `${md(x.arriveDate)} ${x.arriveTime} 着` : "";
      ev.push({ at: [[x.fromCity], [x.toCity]], mv: modeColor(x.mode), k: x.departTime || "12:00", dep: true, arrK: sameDay && x.arriveTime ? x.arriveTime : null, time: x.departTime ? x.departTime + (sameDay && x.arriveTime ? `〜${x.arriveTime}` : "") : "", icon: modeIcon(x.mode), title: `${from} → ${to}`, sub: [x.mode, x.airline, arr, dur, x.cls].filter(Boolean).join(" ・ "), st, edit: { kind: "transit", id: x.id } });
    } else if (x.arriveDate === iso && x.departDate && x.departDate < iso) {
      ev.push({ at: [[x.toCity]], mv: modeColor(x.mode), k: x.arriveTime || "08:00", arr: true, time: x.arriveTime, icon: "pin", title: `${to} 着`, sub: `${md(x.departDate)} ${from}発 ・ ${x.airline || x.mode}`, edit: { kind: "transit", id: x.id } });
    }
  });
  (t.localTransport || []).filter(l => l.date === iso).forEach(l => ev.push({
    at: l.category === "移動" ? [[l.fromAddress], [l.toAddress]] : [[l.address, l.desc]], mv: l.category === "移動" ? modeColor(l.mode) : null, ll: l.category === "移動" ? null : l.geo || null,
    k: l.startTime || "13:00", time: l.startTime ? l.startTime + (l.endTime ? `〜${l.endTime}` : "") : "", icon: catIcon(l.category), title: l.desc || l.category,
    sub: [l.category, l.category === "移動" ? [l.fromAddress, l.toAddress].filter(Boolean).join(" → ") : l.address].filter(Boolean).join(" ・ "), st: localState(l), edit: { kind: "local", id: l.id },
    map: l.category !== "移動" && l.address ? l.address : "",
  }));
  if (starting) {
    const h = hotelOf(t, starting) || {};
    ev.push(starting.noHotel
      ? { at: [[starting.city]], k: h.checkinTime || "18:00", icon: "home", title: `${starting.lodgingLabel || "宿不要"}へ`, sub: splitCity(starting.city).main, edit: { kind: "stay", id: starting.id } }
      : { at: [[h.address, h.name]], ll: h.geo || null, k: h.planCheckin || h.checkinTime || "15:00", ci: !(h.planCheckin || h.checkinTime), time: h.planCheckin || h.checkinTime, rule: !h.planCheckin && !!h.checkinTime, icon: "bed", title: "チェックイン",
          sub: [h.name || "宿未定", !h.planCheckin && h.checkinTime ? `${h.checkinTime}から（宿の決まり）` : h.planCheckin && h.checkinTime && h.planCheckin < h.checkinTime ? `決まりは${h.checkinTime}から。早く着いたら荷物を預けられるか確かめておく` : ""].filter(Boolean).join(" ・ "), warn: !!(h.planCheckin && h.checkinTime && h.planCheckin < h.checkinTime), st: stayState(t, starting), edit: { kind: "stay", id: starting.id }, map: h.address || "" });
  }
  // 時刻のないチェックアウトはその日の最初の出発より前、チェックインは最後の到着より後に置く
  const deps = ev.filter(e => e.dep).map(e => e.k).sort(), arrs = ev.filter(e => e.arr || e.arrK).map(e => e.arr ? e.k : e.arrK).sort();
  // 時刻のないチェックアウトは、その日のほかの予定よりも前（朝いちばん）に置く
  const firstK = ev.filter(e => !e.co && !e.ci && !e.arr).map(e => e.k).sort()[0];
  ev.forEach(e => { if (e.co && deps.length && deps[0] < e.k) e.k = deps[0]; if (e.co && firstK && firstK < e.k) e.k = firstK; if (e.ci && arrs.length && arrs[arrs.length - 1] >= e.k) e.k = arrs[arrs.length - 1] + "~"; });
  // 同じ時刻なら「着く」→ 時刻のないチェックアウト → 予定（チェックインなど）→ 出発する移動 の順。移動はその場所での予定のあとに出る
  const rank = (e) => e.arr ? 0 : e.co ? 0.5 : e.mv ? 2 : 1;
  ev.sort((a, b) => a.k.localeCompare(b.k) || rank(a) - rank(b));
  const arrivals = transitsOf(t).filter(x => isLeg(x) && x.arriveDate === iso && x.departDate && x.departDate < iso);
  const dep = transitsOf(t).filter(x => isLeg(x) && x.departDate === iso).sort((a, b) => (a.departTime || "").localeCompare(b.departTime || ""));
  // 見出し：移動のある日は「出発した所 → その日の最後に着く所」、同じ都市で宿を移る日は「◯◯（宿を移動）」
  const pn = (n) => splitCity(n).main.replace(/\s*\([A-Z]{3}\)\s*$/, "");
  const from = ending ? stayShort(ending) : dep.length ? pn(dep[0].fromCity) : "";
  const to = sleeping ? stayShort(sleeping) : dep.length ? pn(dep[dep.length - 1].toCity) : starting ? stayShort(starting) : "";
  const head = (dep.length || (ending && starting)) && from && to
      ? (from === to ? `${from}（宿を移動）` : `${from} → ${to}`)
    : sleeping ? stayShort(sleeping)
    : arrivals.length ? `${pn(arrivals[arrivals.length - 1].toCity)} 着`
    : ev.length ? "移動日" : "予定なし";
  const night = sleeping ? (sleeping.noHotel ? { name: sleeping.lodgingLabel || "宿不要" } : hotelOf(t, sleeping) || {}) : null;
  return { ev, head, sleeping, night };
}
// 予定と予定の間に足すときの時刻（前後の真ん中を15分単位で。後ろがなければ前の1時間後）
const toMin = (hm) => { const m = /^(\d{1,2}):(\d{2})/.exec(hm || ""); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const fromMin = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
function betweenTime(a, b) {
  const x = toMin(a), y = toMin(b);
  if (x != null && y != null && y > x) return fromMin(Math.round((x + y) / 2 / 15) * 15);
  if (x != null && x + 60 < 24 * 60) return fromMin(Math.ceil((x + 60) / 15) * 15);
  return "";
}
// 2点の距離から、移動にかかる時間のだいたいの目安を出す（道は直線の1.3倍として計算。5分単位）
function moveEstimates(a, b) {
  const R = 6371, rad = (x) => x * Math.PI / 180;
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const km = 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2)) * 1.3;
  const r5 = (m) => Math.max(5, Math.round(m / 5) * 5);
  const out = [];
  if (km <= 2.5) out.push({ mode: "徒歩", icon: "route", min: r5(km / 4.5 * 60) });
  if (km >= 1.2) out.push({ mode: "電車", icon: "train", min: r5(10 + km / 30 * 60) });
  if (km >= 0.8 && km <= 40) out.push({ mode: "タクシー", icon: "car", min: r5(5 + km / 22 * 60) });
  return { km, out };
}
const hhmm = (s) => { const m = String(s || "").match(/\d{1,2}:\d{2}/g); return m ? m : []; };
// 保存してある位置を探す。名前が少し違っても（「○○ホテル」と「○○ホテル, 住所…」など）同じ場所として見る
function geoNear(n, saved) {
  if (!n || !saved) return null;
  if (saved[n]) return saved[n];
  const low = n.toLowerCase();
  // 短い名前（都市名など）は広すぎるので、少し長い名前どうしだけ比べる
  const k = Object.keys(saved).find(k => k.length >= 8 && (low.includes(k.toLowerCase()) || (n.length >= 8 && k.toLowerCase().includes(low))));
  return k ? saved[k] : null;
}
// 次の日に着く移動（夜行列車・夜行フェリー・夜の便）があれば、その夜は宿のいらない夜
const overnightMove = (t, iso) => transitsOf(t).find(x => x.departDate === iso && ((isISO(x.arriveDate) && x.arriveDate > iso) || (/^夜行/.test(x.mode || "") && !(isISO(x.arriveDate) && x.arriveDate === iso))));
const overnightLabel = (m) => /フェリー|船/.test(m || "") ? "船中泊" : /飛行機/.test(m || "") ? "機内泊" : /バス/.test(m || "") ? "車中泊（夜行バス）" : "車中泊";
function DayTimeline({ t, iso, onEdit, showNight = true, onInsert }) {
  const { ev, sleeping, night } = dayEvents(t, iso);
  const overnight = !sleeping ? overnightMove(t, iso) : null;
  const saveGeo = React.useContext(GeoCtx);
  const [locating, setLocating] = useState(null);
  // 予定と予定の間の「＋」。押すと、時刻と前後の場所が入った追加の画面が開く（予定／移動は画面の上で切り替える）
  const gap = (i) => {
    if (!onInsert) return null;
    const a = ev[i], b = ev[i + 1];
    // 場所は見出し（「○○ 発 → △△」など）ではなく、その予定・移動の本当の場所から取る。前は「終わったあとにいる所」、後ろは「始まる所」
    const placeOf = (e, last) => { if (!e) return ""; const g = (e.at || []).filter(x => x && x.some(Boolean)); const grp = last ? g[g.length - 1] : g[0]; const v = String((grp && grp.find(Boolean)) || e.map || "").trim();
      return e.edit && e.edit.kind === "local" && grp && !String(grp[0] || "").trim() ? v.replace(/\s*(を|で|に|へ)?\s*(散策|散歩|観光|見学|めぐり|巡り|ぶらぶら|食べ歩き|昼ごはん|朝ごはん|夜ごはん|ごはん|ランチ|ディナー|食事|買い物|ショッピング|行く|行きたい)\s*$/, "") : v; };
    const opts = { time: betweenTime(a && a.time, b && b.time), from: placeOf(a, true), to: placeOf(b, false) };
    // 前後の場所の位置が分かれば、移動の目安を出す（どちらかがすでに移動なら出さない）
    const isMove = (e) => e && !!e.mv;
    // 予定は「場所」が入っていればそれだけで探す（予定の名前に残った古い位置を使わないように）
    const namesOf = (e, last) => { const g = (e.at || []).filter(x => x && x.some(Boolean)); const grp = last ? g[g.length - 1] : g[0]; const ns = (grp || []).map(n => String(n || "").trim()).filter(n => n && !/未定/.test(n)); return e.edit && e.edit.kind === "local" && String((grp || [])[0] || "").trim() ? ns.slice(0, 1) : ns; };
    const geoOf = (e, last) => { if (e.ll) return { name: namesOf(e, last)[0] || e.title, ll: e.ll }; for (const n of namesOf(e, last)) { const ll = geoNear(n, t.geo); if (ll) return { name: n, ll }; } return null; };
    // × で閉じた目安は出さない（場所が変わればまた出る）
    const hideKey = b ? `${namesOf(a, true)[0] || a.title}>${namesOf(b, false)[0] || b.title}` : "";
    const both = b && !isMove(a) && !isMove(b) && !(t.moveHintsOff || []).includes(hideKey);
    const closeBtn = <button className="tl-move-x" aria-label="この目安を閉じる" title="閉じる" onClick={() => onInsert("local", { hideHint: hideKey })}><Icon n="x" s={11} /></button>;
    const pa = both && geoOf(a, true), pb = both && geoOf(b, false);
    const est = pa && pb && pa.name !== pb.name ? moveEstimates(pa.ll, pb.ll) : null;
    // 位置が分からない場所があれば、押したときだけ Google で調べる（1日の回数に限りがあるので自動では調べない）
    const missing = both && !(pa && pb) && typeof Places !== "undefined" && saveGeo ? [[a, true, pa], [b, false, pb]].filter(([e, l, p]) => !p && namesOf(e, l).length).map(([e, l]) => namesOf(e, l)) : [];
    if (missing.length && missing.length + (pa ? 1 : 0) + (pb ? 1 : 0) === 2) {
      const look = async () => {
        setLocating(i);
        let fail = 0;
        for (const ns of missing) {
          let r = null;
          for (const n of ns) { try { r = await Places.locate(n); } catch (e) { r = null; } if (r) { saveGeo([n], llOf(r)); break; } }
          if (!r) fail++;
        }
        setLocating(null);
        if (fail) alert("場所の位置が見つかりませんでした。予定を開いて、場所を候補から選び直すと出せるようになります。");
      };
      return (
        <div key={"g" + i} className="tl-move">
          <button className="tl-gap" style={{ margin: 0, width: "auto", padding: 0 }} aria-label={`${a.title} と ${b.title} の間に追加`} onClick={() => onInsert("local", opts)}><span><Icon n="plus" s={12} /></span></button>
          <span className="tl-move-body"><button className="tl-move-chip" disabled={locating != null} onClick={look}>{locating === i ? "調べています…" : "移動の目安を出す"}</button>{closeBtn}</span>
        </div>
      );
    }
    if (est && est.out.length) {
      const endA = hhmm(a.time).pop(), startB = hhmm(b.time)[0];
      const gapMin = endA && startB ? toMin(startB) - toMin(endA) : null;
      const best = Math.min(...est.out.map(o => o.min));
      const add = (o) => { const st = endA || ""; onInsert("local", { quick: { category: "移動", desc: `${pa.name} → ${pb.name}`, mode: o.mode, fromAddress: pa.name, toAddress: pb.name, startTime: st, endTime: st ? fromMin(Math.min(24 * 60 - 1, toMin(st) + o.min)) : "" } }); };
      const url = `https://www.google.com/maps/dir/?api=1&origin=${pa.ll.join(",")}&destination=${pb.ll.join(",")}&travelmode=transit`;
      return (
        <div key={"g" + i} className="tl-move">
          <button className="tl-gap" style={{ margin: 0, width: "auto", padding: 0 }} aria-label={`${a.title} と ${b.title} の間に追加`} onClick={() => onInsert("local", opts)}><span><Icon n="plus" s={12} /></span></button>
          <span className="tl-move-body">
            <span className="tl-move-lbl" title={`${pa.name} → ${pb.name}`}>目安（約{est.km < 10 ? est.km.toFixed(1) : Math.round(est.km)}km）</span>
            {est.out.map(o => <button key={o.mode} className="tl-move-chip" title={`${o.mode}の移動として追加`} onClick={() => add(o)}><Icon n={o.icon} s={12} />{o.mode} 約{o.min}分</button>)}
            <a className="tl-move-chip" href={url} target="_blank" rel="noopener noreferrer">経路<Icon n="ext" s={11} /></a>
            {closeBtn}
            {gapMin != null && gapMin >= 0 && gapMin < best && <span className="tl-move-warn">移動に約{best}分かかりますが、間は{gapMin}分です</span>}
          </span>
        </div>
      );
    }
    return <button key={"g" + i} className={"tl-gap" + (b ? "" : " last")} aria-label={b ? `${a.title} と ${b.title} の間に追加` : `${a.title} のあとに追加`} onClick={() => onInsert("local", opts)}><span><Icon n="plus" s={12} /></span></button>;
  };
  return (
    <>
      {ev.length === 0 && <p className="empty" style={{ padding: "10px 14px" }}>この日の予定はまだありません。</p>}
      {ev.map((e, i) => [(
        <div key={i} className={"bookrow" + (e.mv ? " tl-mv" : "")} style={{ gridTemplateColumns: "56px minmax(0,1fr) auto", cursor: "default", minHeight: e.mv ? 40 : 52, padding: e.mv ? "4px 14px" : "8px 14px", ...(e.mv ? { "--mvc": e.mv } : {}) }}>
          <span className="mono" title={e.rule ? "宿の決まりの時刻（行く時刻は宿の画面で入れられます）" : undefined} style={{ fontSize: e.mv ? 13 : 15, fontWeight: 600, color: !e.time || e.rule ? "var(--faint)" : e.mv ? "var(--muted)" : "var(--ink)" }}>{e.time ? e.time.slice(0, 5) : "—"}{e.mv && hhmm(e.time).length > 1 && <span className="xs" style={{ display: "block", fontWeight: 500, color: "var(--faint)" }}>〜{hhmm(e.time).pop()}</span>}</span>
          <button className={e.mv ? "tl-mvbox" : ""} style={{ border: 0, background: "none", textAlign: "left", padding: 0, minWidth: 0 }} onClick={() => onEdit(e.edit)}>
            <span className="t1">{e.mv ? <span className="tl-mvico"><Icon n={e.icon} s={13} /></span> : <span style={{ verticalAlign: "-3px", marginRight: 6, display: "inline-flex" }}><Icon n={e.icon} s={16} /></span>}{e.title}</span>
            {e.sub && <span className="t2" style={{ whiteSpace: "normal", ...(e.warn ? { color: "var(--orange)" } : {}) }}>{e.sub}</span>}
            {e.st && isOpenState(e.st) && <span className="pill tone-open" style={{ marginTop: 4 }}><i />{e.st.label}</span>}
          </button>
          {e.map ? <a className="iconbtn" aria-label="地図で開く" href={`https://www.google.com/maps?q=${encodeURIComponent(e.map)}`} target="_blank" rel="noopener noreferrer"><Icon n="pin" /></a> : <span />}
        </div>
      ), gap(i)])}
      {showNight && sleeping && (
        <div className="row between" style={{ padding: "10px 14px", flexWrap: "nowrap", background: "#FAFAF8", cursor: onInsert ? "pointer" : undefined }} onClick={onInsert ? (ev) => { if (ev.target.closest("a")) return; onEdit({ kind: "stay", id: sleeping.id }); } : undefined}>
          <span style={{ minWidth: 0 }}><span className="xs muted">この夜の宿{onInsert ? "（押すと入力・変更）" : ""}</span><span className="t1" style={{ fontSize: 13 }}>{night.name || "宿未定"}</span>
            {night.address && <a className="xs" href={`https://www.google.com/maps?q=${encodeURIComponent(night.address)}`} target="_blank" rel="noopener noreferrer">{night.address}</a>}
            {night.confirmation && <span className="xs muted" style={{ display: "block" }}>予約番号 <span className="mono">{night.confirmation}</span></span>}</span>
          <Pill st={stayState(t, sleeping)} />
        </div>
      )}
      {/* 夜行列車・夜行フェリー・夜の便など、次の日に着く移動の夜は「車中泊」などとして出す（宿の未手配にしない） */}
      {showNight && !sleeping && overnight && (
        <div className="row between" style={{ padding: "10px 14px", flexWrap: "nowrap", background: "#FAFAF8" }}>
          <span style={{ minWidth: 0 }}><span className="xs muted">この夜</span><span className="t1" style={{ fontSize: 13 }}>{overnightLabel(overnight.mode)}（{splitCity(overnight.fromCity).main} → {splitCity(overnight.toCity).main}）</span></span>
          <span className="pill tone-none">宿は不要</span>
        </div>
      )}
      {/* 泊まる滞在がない夜（旅行の最終日は除く）は、ここから宿を入れられるように */}
      {showNight && !sleeping && !overnight && onInsert && (() => { const r = tripRange(t); return r && iso < r.end; })() && (
        <div className="row between" style={{ padding: "10px 14px", flexWrap: "nowrap", background: "#FAFAF8" }}>
          <span style={{ minWidth: 0 }}><span className="xs muted">この夜の宿</span><span className="t1" style={{ fontSize: 13 }}>まだ入っていません</span></span>
          <button className="btn small" onClick={() => onInsert("local", { stay: true })}><Icon n="plus" s={14} />宿を入れる</button>
        </div>
      )}
    </>
  );
}
function DayDetail({ t, iso, setIso, onEdit, onAddLocal, onAddMove, onSuggest }) {
  const r = tripRange(t);
  const { head, sleeping } = dayEvents(t, iso);
  const canPrev = r && iso > r.start, canNext = r && iso < r.end;
  return (
    <>
      <div className="row between" style={{ flexWrap: "nowrap" }}>
        <button className="iconbtn" aria-label="前の日" disabled={!canPrev} onClick={() => setIso(addDays(iso, -1))} style={{ transform: "rotate(90deg)" }}><Icon n="down" /></button>
        <div style={{ textAlign: "center", minWidth: 0 }}>
          <div className="mono small muted">{iso.replace(/-/g, ".")}（{wdOf(iso)}）{r && iso >= r.start && iso <= r.end ? ` ・ ${dayDiff(r.start, iso) + 1}日目` : ""}</div>
          <h2 style={{ fontSize: 20 }}>{head}</h2>
        </div>
        <button className="iconbtn" aria-label="次の日" disabled={!canNext} onClick={() => setIso(addDays(iso, 1))} style={{ transform: "rotate(-90deg)" }}><Icon n="down" /></button>
      </div>
      <div className="card flush divide"><DayTimeline t={t} iso={iso} onEdit={onEdit} onInsert={(k, o) => k === "move" ? onAddMove(iso, o) : onAddLocal(iso, o)} /></div>
      <DayMap t={t} iso={iso} />
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <button className="btn block" style={{ flex: 1 }} onClick={() => onAddLocal(iso)}><Icon n="plus" s={16} />予定・移動を追加</button>
        {onSuggest && <button className="btn block" style={{ flex: 1 }} onClick={() => onSuggest(iso)}>予定を提案してもらう</button>}
      </div>
      {sleeping && sleeping.memo && <div className="note" style={{ whiteSpace: "pre-wrap" }}>{sleeping.memo}</div>}
    </>
  );
}

// ================= Claude の提案 =================
const suggestErr = (e) => e && e.code === "not_granted" ? "Claudeの利用が許可されませんでした" : e && e.code === "rate_limited" ? "混み合っています。少し待ってからもう一度お試しください" : "提案を作れませんでした。もう一度お試しください";
const durText = (m) => { const n = Math.round(Number(m) || 0); return n ? `${Math.floor(n / 60) ? Math.floor(n / 60) + "時間" : ""}${n % 60 ? (n % 60) + "分" : ""}` : "—"; };
function TransitSuggest({ t, x, set }) {
  const [st, setSt] = useState({ s: "idle", items: [], msg: "" });
  const run = async () => {
    const sample = await useCap("sample");
    if (!sample) { setSt({ s: "err", items: [], msg: "この表示ではClaudeを呼び出せません" }); return; }
    setSt({ s: "busy", items: [], msg: "" });
    try {
      const res = await sample.json(transitSuggestPrompt(t, x), { modelTier: "default" });
      const items = (res && Array.isArray(res.options) ? res.options : []).filter(o => o && o.summary).slice(0, 3);
      setSt({ s: "ok", items, msg: items.length ? "" : "候補が見つかりませんでした" });
    } catch (e) { setSt({ s: "err", items: [], msg: suggestErr(e) }); }
  };
  const pick = (o) => {
    const ppl = x.people || 1, per = Math.round(Number(o.price_jpy) || 0);
    set({ mode: MODES.includes(o.mode) ? o.mode : x.mode, airline: o.carrier || x.airline, price: per ? per * ppl : x.price,
      memo: [x.memo, `【提案】${o.summary}（所要${durText(o.duration_min)}・${o.frequency || ""}・目安${yen(per)}/人）${o.tip ? " " + o.tip : ""}`].filter(Boolean).join("\n") });
    setSt({ s: "idle", items: [], msg: "反映しました。時刻は公式サイトで確認して入れてください" });
  };
  return (
    <section className="stack" style={{ gap: 8 }}>
      <div className="row between"><span className="small" style={{ fontWeight: 700 }}>移動手段の提案</span>
        <button className="btn small" disabled={st.s === "busy"} onClick={run}>{st.s === "busy" ? "考えています…" : st.items.length ? "もう一度" : "Claudeに提案してもらう"}</button></div>
      {st.msg && <div className={st.s === "err" ? "err" : "note"}>{st.msg}</div>}
      {st.items.map((o, i) => (
        <div key={i} className="inboxitem" style={{ gap: 4 }}>
          <div className="row between" style={{ flexWrap: "nowrap" }}><b style={{ minWidth: 0 }}><Icon n={modeIcon(o.mode)} s={15} /> {o.mode} ・ {o.carrier}</b><span className="mono small">{durText(o.duration_min)}</span></div>
          <div className="small">{o.summary}</div>
          <div className="xs muted">{[o.frequency, Number(o.price_jpy) ? `目安 ${yen(o.price_jpy)}/人` : "", o.pros].filter(Boolean).join(" ・ ")}</div>
          {o.tip && <div className="xs muted">コツ：{o.tip}</div>}
          <div><button className="btn small primary" onClick={() => pick(o)}>これにする</button></div>
        </div>
      ))}
      {st.items.length > 0 && <div className="xs muted">{SUGGEST_NOTE}</div>}
    </section>
  );
}
function DaySuggest({ t, iso, update, done }) {
  const [wish, setWish] = useState("");
  const [st, setSt] = useState({ s: "idle", items: [], msg: "" });
  const [sel, setSel] = useState({});
  const run = async () => {
    const sample = await useCap("sample");
    if (!sample) { setSt({ s: "err", items: [], msg: "この表示ではClaudeを呼び出せません" }); return; }
    setSt({ s: "busy", items: [], msg: "" });
    try {
      const res = await sample.json(daySuggestPrompt(t, iso, wish), { modelTier: "default" });
      const items = (res && Array.isArray(res.items) ? res.items : []).filter(o => o && o.title).slice(0, 8);
      setSel(Object.fromEntries(items.map((_, i) => [i, true])));
      setSt({ s: "ok", items, msg: items.length ? "" : "提案が見つかりませんでした" });
    } catch (e) { setSt({ s: "err", items: [], msg: suggestErr(e) }); }
  };
  const add = () => {
    const chosen = st.items.filter((_, i) => sel[i]);
    if (!chosen.length) return;
    update(tr => {
      const stay = staysOf(tr).find(s => s.startDate && iso >= s.startDate && iso < stayEnd(s));
      const rows = chosen.map(o => ({ id: uid(), linkedStayId: stay ? stay.id : null, category: LOCAL_CATS.includes(o.category) ? o.category : "観光", desc: String(o.title), address: String(o.address || ""), fromAddress: "", toAddress: "",
        date: iso, startTime: /^\d{1,2}:\d{2}$/.test(o.time || "") ? o.time : "", endTime: /^\d{1,2}:\d{2}$/.test(o.end_time || "") ? o.end_time : "", mode: "", price: Math.round(Number(o.price_jpy) || 0), people: 1,
        needsBooking: !!o.needs_booking, memo: [o.note, "（Claudeの提案）"].filter(Boolean).join(" "), paymentStatus: "未払い", status: "候補" }));
      const moves = chosen.map((o, i) => o.category === "移動" ? localToMove({ ...rows[i], desc: String(o.title) }) : null).filter(Boolean);
      const plans = rows.filter((_, i) => chosen[i].category !== "移動");
      return { ...tr, itinerary: moves.length ? normalizeItinerary([...tr.itinerary, ...moves]) : tr.itinerary, localTransport: [...(tr.localTransport || []), ...plans] };
    });
    done(chosen.length);
  };
  return (
    <>
      <div className="mono small muted">{iso.replace(/-/g, ".")}（{wdOf(iso)}）</div>
      <h2 style={{ fontSize: 20 }}>{dayEvents(t, iso).head}</h2>
      <Field label="希望（任意）"><TextIn value={wish} onChange={setWish} placeholder="例：美術館が好き、夜は地元の料理、雨でも楽しめる所" /></Field>
      <button className="btn primary block" disabled={st.s === "busy"} onClick={run}>{st.s === "busy" ? "考えています…" : st.items.length ? "もう一度提案してもらう" : "Claudeに提案してもらう"}</button>
      {st.msg && <div className={st.s === "err" ? "err" : "note"}>{st.msg}</div>}
      {st.items.length > 0 && (
        <>
          <div className="card flush divide">
            {st.items.map((o, i) => (
              <label key={i} className="bookrow" style={{ gridTemplateColumns: "28px 56px minmax(0,1fr)", cursor: "pointer" }}>
                <input type="checkbox" checked={!!sel[i]} onChange={e => setSel({ ...sel, [i]: e.target.checked })} style={{ width: 20, height: 20, accentColor: "var(--ink)" }} />
                <span className="mono" style={{ fontWeight: 600 }}>{o.time || "—"}</span>
                <span style={{ minWidth: 0 }}><span className="t1">{o.title}</span>
                  <span className="t2" style={{ whiteSpace: "normal" }}>{[o.category, o.address, Number(o.price_jpy) ? `目安 ${yen(o.price_jpy)}/人` : "", o.needs_booking ? "要予約" : ""].filter(Boolean).join(" ・ ")}</span>
                  {o.note && <span className="xs muted" style={{ display: "block" }}>{o.note}</span>}</span>
              </label>
            ))}
          </div>
          <button className="btn primary block" disabled={!Object.values(sel).some(Boolean)} onClick={add}>選んだ予定を追加（{Object.values(sel).filter(Boolean).length}件）</button>
          <div className="xs muted">{SUGGEST_NOTE}</div>
        </>
      )}
    </>
  );
}

// ================= 予約・手配 =================
// 目安の為替レート（1 外貨 ＝ 何円）。読めないときは 0
const yenRateCache = {};
function yenRate(cur) {
  if (!yenRateCache[cur]) yenRateCache[cur] = fetch("https://open.er-api.com/v6/latest/JPY").then(r => r.json()).then(d => { const v = Number(d && d.rates && d.rates[cur]); return v > 0 ? Math.round(10000 / v) / 10000 : 0; }).catch(() => 0);
  return yenRateCache[cur];
}
function InboxItem({ item, t, onApply, onDecide }) {
  const e = item.extracted || {};
  const foreign = e.total_amount > 0 && e.currency && e.currency !== "JPY";
  const [yenIn, setYenIn] = useState("");
  // 外貨の金額は、旅行に入っているレート（なければ目安のレート）で円にしておく。直せる
  const [rateUsed, setRateUsed] = useState(0);
  useEffect(() => {
    if (!foreign || yenIn) return;
    let alive = true;
    const put = (r) => { if (alive && r > 0) { setRateUsed(r); setYenIn(String(Math.round(Number(e.total_amount) * r))); } };
    const own = Number((t.rates || {})[e.currency]) || 0;
    if (own) put(own); else yenRate(e.currency).then(put);
    return () => { alive = false; };
  }, [foreign, e.currency, e.total_amount]);
  const amount = foreign ? Number(yenIn) || 0 : e.currency === "JPY" ? Math.round(e.total_amount) : 0;
  const p = buildProposal(e, t, amount);
  const cancelled = e.booking_status === "cancelled";
  const show = (v) => typeof v === "number" ? (v > 999 ? yen(v) : String(v)) : (v || "");
  return (
    <div className="inboxitem">
      <div className="row" style={{ gap: 6 }}>
        <span className={"pill " + (cancelled ? "tone-open" : e.is_request ? "tone-none" : "tone-booked")}>{cancelled ? "キャンセル" : e.is_request ? "リクエスト" : e.booking_status === "changed" ? "変更" : "予約"}</span>
        <b style={{ flex: 1, minWidth: 0 }}>{e.summary || item.subject}</b>
      </div>
      <div className="xs muted">{item.from}{item.receivedAt ? ` ・ ${new Date(item.receivedAt).toLocaleDateString("ja-JP")}` : ""}{safeUrl(item.url) && <> ・ <a href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer">メールを開く</a></>}</div>
      <div style={{ fontWeight: 500 }}>→ {p.target}</div>
      {p.dateCheck && <div className="small" style={{ color: p.dateCheck.ok ? "var(--blue)" : "var(--danger)" }}>{p.dateCheck.ok ? "✓ " : "⚠ "}{p.dateCheck.text}</div>}
      {foreign && !cancelled && (
        <label className="field" htmlFor={"yen-" + item.gmailId}><span>金額 {e.currency} {Number(e.total_amount).toLocaleString()} を円にすると{rateUsed ? `（1 ${e.currency} ＝ ${rateUsed}円で計算。直せます）` : "（空なら金額は変えません）"}</span>
          <input id={"yen-" + item.gmailId} type="number" inputMode="numeric" value={yenIn} onChange={ev => setYenIn(ev.target.value)} /></label>
      )}
      {p.changes.length > 0 && (
        <table className="difftable"><tbody>
          {p.changes.map(([label, before, after]) => <tr key={label}><td>{label}</td><td>{before !== undefined && before !== "" && <s>{show(before)}</s>}{before !== undefined && before !== "" && " → "}{show(after)}</td></tr>)}
        </tbody></table>
      )}
      <div className="row">
        {p.apply && <button className="btn small primary" onClick={() => onApply(item, p)}>反映する</button>}
        <button className="btn small" onClick={() => onDecide(item.gmailId, "dismissed")}>{p.apply ? "反映しない" : "確認済みにする"}</button>
      </div>
    </div>
  );
}
function MailCard({ t, update, inbox, scan, onScan, onPaste, onApply, onDecide }) {
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState("");
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <div className="row" style={{ flexWrap: "nowrap", gap: 12 }}>
        <span className="ico blue"><Icon n="mail" /></span>
        <span style={{ flex: 1, minWidth: 0 }}><span className="t1">予約メールの取り込み</span><span className="t2" style={{ whiteSpace: "normal" }}>Gmailに届いた予約確認メールをClaudeが読み取り、旅程と照らし合わせます</span></span>
      </div>
      <div className="fgrid">
        <Field label="Gmailのラベル（このラベルのメールだけ読みます）"><TextIn value={t.gmailLabel} onChange={v => update(tr => ({ ...tr, gmailLabel: v }))} placeholder="空ならキーワードで広く探す" /></Field>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <button className="btn primary" disabled={scan.st === "busy"} onClick={onScan}>{scan.st === "busy" ? "読み取り中…" : scan.more ? "続きを読み取る" : "Gmailから探す"}</button>
          <button className="btn" aria-expanded={paste} onClick={() => setPaste(!paste)}><Icon n="paste" s={16} />貼り付け</button>
        </div>
      </div>
      {scan.msg && <div className={scan.st === "err" ? "err" : "note"}>{scan.msg}</div>}
      {paste && (
        <div className="stack" style={{ gap: 8 }}>
          <Field label="予約確認メールの本文をそのまま貼り付けてください（スマホで予約したときなど）"><textarea value={text} onChange={e => setText(e.target.value)} style={{ minHeight: 140 }} /></Field>
          <button className="btn primary" disabled={!text.trim() || scan.st === "busy"} onClick={async () => { if (await onPaste(text)) { setText(""); setPaste(false); } }}>読み取る</button>
        </div>
      )}
      {inbox.length > 0 && <div className="stack" style={{ gap: 10 }}>
        <div className="small" style={{ fontWeight: 700 }}>取り込み候補 {inbox.length}件</div>
        {inbox.map(item => <InboxItem key={item.gmailId} item={item} t={t} onApply={onApply} onDecide={onDecide} />)}
      </div>}
    </section>
  );
}
function BookView({ t, filter, setFilter, onEdit, onAddLocal, mail, entry }) {
  const items = [];
  staysOf(t).forEach(s => { if (s.noHotel) return; const h = hotelOf(t, s); const cm = splitCity(s.city).main; items.push({ type: "stay", date: s.startDate, icon: "bed", title: h && h.name ? h.name : stayTitle(s, "宿"), sub: `${md(s.startDate)}〜${md(stayEnd(s))} ・ ${nightsOf(s)}泊${h && h.name && cm ? " ・ " + cm : ""}`, st: stayState(t, s), price: h ? h.total : 0, ptext: h ? priceText(h, "total") : "", foreign: !!(h && h.priceCur && Number(h.priceAmt) > 0), people: h ? peopleOf(h) : 1, edit: { kind: "stay", id: s.id } }); });
  transitsOf(t).forEach(x => items.push({ type: "transit", town: !isLeg(x) && transitState(x).key === "free", date: x.departDate, icon: modeIcon(x.mode), title: moveTitle(x), sub: `${md(x.departDate)}${x.departTime ? " " + x.departTime : ""} ・ ${x.mode || "未定"}${x.airline ? " ・ " + x.airline : ""}`, st: transitState(x), price: x.price, ptext: priceText(x), foreign: !!(x.priceCur && Number(x.priceAmt) > 0), people: peopleOf(x), edit: { kind: "transit", id: x.id } }));
  (t.localTransport || []).forEach(l => items.push({ type: "local", date: l.date, icon: catIcon(l.category), title: l.desc || l.category, sub: `${md(l.date)}${l.startTime ? " " + l.startTime : ""} ・ ${l.category}`, st: localState(l), price: l.price, ptext: priceText(l), foreign: !!(l.priceCur && Number(l.priceAmt) > 0), people: peopleOf(l), edit: { kind: "local", id: l.id } }));
  const tk = (x) => x.type === "transit" ? (transitsOf(t).find(r => r.id === (x.edit && x.edit.id)) || {}).departTime || "" : x.type === "local" ? ((t.localTransport || []).find(r => r.id === (x.edit && x.edit.id)) || {}).startTime || "" : "";
  items.sort((a, b) => (a.date || "9").localeCompare(b.date || "9") || tk(a).localeCompare(tk(b)));
  // 予約の要らない街の中の移動（タクシー・徒歩など）は、「その他の条件」で選んだときだけ出す
  const townN = items.filter(i => i.town).length;
  const byState = (k) => items.filter(i => (filter.town || !i.town) && (k === "all" ? true : k === "open" ? i.st.tone === "open" : i.st.tone === k));
  const shown = byState(filter.state).filter(i => filter.type === "all" || i.type === filter.type);
  // よく使うのは「すべて」と「未手配」。それ以外の条件は「その他の条件」の中に
  const moreF = filter.state === "booked" || filter.state === "paid" || filter.type !== "all" || !!filter.town;
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="stack">
      <div className="row between" style={{ marginTop: 4 }}><h1>予約・手配</h1><button className="btn" onClick={onAddLocal}><Icon n="plus" s={16} />追加</button></div>
      {entry}
      {mail}
      <div className="chips" aria-label="絞り込み">
        {[["all", "すべて"], ["open", "未手配"]].map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={filter.state === k && !moreF} onClick={() => setFilter({ ...filter, state: k, type: "all", town: false })}>{l} <b style={k === "open" && byState(k).length && !(filter.state === k && !moreF) ? { color: "var(--orange)" } : undefined}>{byState(k).length}</b></button>
        ))}
        <button className="chip" aria-pressed={moreF} aria-expanded={showMore} onClick={() => setShowMore(!showMore)}>{moreF ? [filter.state !== "all" && filter.state !== "open" ? { booked: "予約済み", paid: "支払い済み" }[filter.state] : "", filter.type !== "all" ? { stay: "宿", transit: "移動", local: "予定" }[filter.type] : "", filter.town ? "街の中の移動" : ""].filter(Boolean).join("・") : "その他の条件"}<Icon n="down" s={12} /></button>
      </div>
      {showMore && (
        <div className="chips" style={{ marginTop: -6 }}>
          {[["booked", "予約済み"], ["paid", "支払い済み"]].map(([k, l]) => <button key={k} className="chip" aria-pressed={filter.state === k} onClick={() => setFilter({ ...filter, state: filter.state === k ? "all" : k })}>{l} <b>{byState(k).length}</b></button>)}
          <span className="chipsep" aria-hidden="true" />
          {[["stay", "宿"], ["transit", "移動"], ["local", "予定"]].map(([k, l]) => <button key={k} className="chip" aria-pressed={filter.type === k} onClick={() => setFilter({ ...filter, type: filter.type === k ? "all" : k })}>{l}</button>)}
          {townN > 0 && <button className="chip" aria-pressed={!!filter.town} onClick={() => setFilter({ ...filter, town: !filter.town })}>街の中の移動も出す <b>{townN}</b></button>}
        </div>
      )}
      <div className="card flush divide">
        {shown.length === 0 && <p className="empty">該当するものはありません。</p>}
        {shown.map((i, n) => (
          <button key={n} className="bookrow" onClick={() => onEdit(i.edit)}>
            <span className={"ico " + (i.st.tone === "open" ? "open" : i.st.tone === "none" ? "" : "blue")} style={i.st.tone === "none" ? { background: "var(--sunk)" } : i.st.tone === "paid" ? { background: "var(--ink)", color: "#fff" } : undefined}><Icon n={i.icon} /></span>
            <span style={{ minWidth: 0 }}><span className="t1">{i.title}</span><span className="t2">{i.sub}</span></span>
            <span style={{ textAlign: "right" }}><Pill st={i.st} />{(Number(i.price) > 0 || i.foreign) && <div className="mono small muted" style={{ marginTop: 4 }}>{i.ptext}{i.people > 1 && <span className="xs">（{i.people}人分）</span>}</div>}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ================= お金 =================
function MoneyView({ t, stats, update, mode, setMode, tripId, setMe }) {
  const [allView, setAllView] = useState(false);
  const [newName, setNewName] = useState("");
  // 何も選んでいないときは、旅行の前は予算、旅行中・旅行のあとは支出を開く
  const tr0 = tripRange(t);
  mode = mode || (tr0 && todayISO() >= tr0.start ? "expense" : "budget");
  // 予算の項目：名前を直す・消すのは「直す」を押したときだけ。予算の金額は「＋予算」を押したら出す
  const [editRow, setEditRow] = useState(null);
  const [openTarget, setOpenTarget] = useState({});
  const participants = t.participants || [];
  const my = useMemo(() => myShare(t), [t]);
  const mine = allView ? null : my;
  const rows = (t.budget || []).map(b => ({ ...b, actualV: budgetActual(b, stats, mine, t), linkedN: budgetLinked(t, b).length }));
  const totalT = rows.reduce((a, r) => a + (Number(r.target) || 0), 0), totalA = rows.reduce((a, r) => a + r.actualV, 0);
  // 予算を入れた項目だけで比べる（一部の項目だけ予算を入れたときに「超過」と誤って出ないように）
  const partial = rows.some(r => !(Number(r.target) > 0)) && totalT > 0;
  const totalAT = rows.reduce((a, r) => a + (Number(r.target) > 0 ? r.actualV : 0), 0);
  const setB = (id, patch) => update(tr => ({ ...tr, budget: tr.budget.map(b => b.id === id ? { ...b, ...patch } : b) }));
  // 参加者の名前を直す：支出（払った人・誰の分か）、アカウントとの結びつき、自分の設定もまとめて直す
  const [renaming, setRenaming] = useState(null);
  const doRename = () => {
    const from = renaming.from, to = String(renaming.to || "").trim();
    if (!to || to === from) { setRenaming(null); return; }
    if (participants.includes(to)) { alert(`「${to}」はもう参加者にいます。`); return; }
    const sw = (x) => x === from ? to : x;
    update(tr => ({
      ...tr, participants: (tr.participants || []).map(sw), myName: sw(tr.myName),
      memberLinks: Object.fromEntries(Object.entries(tr.memberLinks || {}).map(([k, v]) => [k, sw(v)])),
      dayParticipants: Object.fromEntries(Object.entries(tr.dayParticipants || {}).map(([k, v]) => [k, (v || []).map(sw)])),
      expenses: (tr.expenses || []).map(e => ({ ...e, payer: sw(e.payer), split: (e.split || []).map(sw) })),
    }));
    setRenaming(null);
  };
  // 参加者を外す：その人が払った・その人の分の支出があれば、精算から外れることを確かめる
  const removeMember = (p) => {
    const paid = (t.expenses || []).filter(e => e.payer === p).length, inSplit = (t.expenses || []).filter(e => e.payer !== p && (e.split || []).includes(p)).length;
    const msg = [paid && `${p}さんが払った支出が${paid}件あります。外すと、精算で計算されなくなります。`, inSplit && `${p}さんの分を含む支出が${inSplit}件あります。外すと、残りの人で割ります。`].filter(Boolean).join("\n");
    if (msg && !confirm(msg + "\n（支出の記録は残ります。名前を直すときは、えんぴつのボタンを使ってください）\n外しますか？")) return;
    update(tr => ({ ...tr, participants: tr.participants.filter(x => x !== p), myName: tr.myName === p ? "" : tr.myName, memberLinks: Object.fromEntries(Object.entries(tr.memberLinks || {}).filter(([, v]) => v !== p)) }));
  };
  const addMember = () => { const n = newName.trim(); if (!n || participants.includes(n)) return; update(tr => ({ ...tr, participants: [...(tr.participants || []), n] })); setNewName(""); };
  return (
    <div className="stack">
      <h1 style={{ marginTop: 4 }}>お金</h1>
      <div className="seg" role="tablist"><button role="tab" aria-selected={mode === "budget"} onClick={() => setMode("budget")}>予算</button><button role="tab" aria-selected={mode === "expense"} onClick={() => setMode("expense")}>支出</button><button role="tab" aria-selected={mode === "split"} onClick={() => setMode("split")}>精算</button></div>
      {mode === "expense" && <ExpenseView t={t} update={update} />}
      {mode === "budget" && <>
        <section className="card stack" style={{ gap: 8 }}>
          <div className="fgrid">
            <Field label="予算（1人分・円）"><NumIn value={t.totalBudget} onChange={v => update(tr => ({ ...tr, totalBudget: v }))} /></Field>
            <div className="field"><span>{!mine ? "全員分の合計" : "1人分の見込み"}</span><div className="mono" style={{ fontSize: 22, fontWeight: 600, padding: "4px 0" }}>{yen(totalA)}</div></div>
          </div>
          <div className="bar" style={{ height: 10 }}><span style={{ width: `${Math.min(100, t.totalBudget ? totalA / t.totalBudget * 100 : 0)}%`, background: t.totalBudget && totalA > t.totalBudget ? "var(--danger)" : "var(--ink)" }} /></div>
          <div className="seg" role="tablist" aria-label="金額の見方" style={{ alignSelf: "flex-start" }}><button role="tab" aria-selected={!allView} onClick={() => setAllView(false)}>1人分</button><button role="tab" aria-selected={allView} onClick={() => setAllView(true)}>全員分</button></div>
          <div className="note">宿や移動の金額を、それぞれ何人分かで割って1人分を出しています。食費などは「支出」に記録すると、ここに入ります。</div>
        </section>
        <section className="card budget2">
          {rows.map(r => { const tg = Number(r.target) || 0, diff = tg - r.actualV; return (
            <div key={r.id} className="brow2">
              {editRow === r.id || !r.category ? (
                <div className="brow2-h">
                  <input className="input" aria-label="項目名" placeholder="項目の名前（例：お土産）" autoFocus={editRow === r.id} value={r.category} onChange={e => setB(r.id, { category: e.target.value })} onKeyDown={e => e.key === "Enter" && setEditRow(null)} />
                  <button className="btn small" onClick={() => setEditRow(null)}>決定</button>
                  <button className="btn small ghost" style={{ color: "var(--danger)" }} onClick={() => { if (confirm(`「${r.category || "この項目"}」を予算から消しますか？`)) { update(tr => ({ ...tr, budget: tr.budget.filter(b => b.id !== r.id) })); setEditRow(null); } }}>消す</button>
                </div>
              ) : (
                <div className="brow2-h">
                  <b style={{ flex: 1, minWidth: 0, fontSize: 15 }}>{r.category}</b>
                  <button className="iconbtn" aria-label={`${r.category}の名前を直す・消す`} title="名前を直す・消す" onClick={() => setEditRow(r.id)}><Icon n="pencil" s={14} /></button>
                </div>
              )}
              <div className="brow2-g">
                <label><span>予算</span>{tg || openTarget[r.id] ? <NumIn value={tg ? r.target : ""} onChange={v => setB(r.id, { target: v })} className="input" aria-label={`${r.category}の予算`} /> : <button className="btn small ghost" style={{ justifyContent: "flex-start", padding: "8px 0", color: "var(--blue)" }} onClick={() => setOpenTarget({ ...openTarget, [r.id]: true })}><Icon n="plus" s={12} />予算を入れる</button>}</label>
                <label><span>{r.auto ? "見込み（自動）" : r.linkedN ? `支出から（${r.linkedN}件）` : "実費"}</span>{r.auto || r.linkedN ? <b className="mono">{yen(r.actualV)}</b> : <NumIn value={r.actual} onChange={v => setB(r.id, { actual: v })} className="input" aria-label={`${r.category}の実費`} />}</label>
                <div><span>差額</span><b className={"mono" + (tg && diff < 0 ? " over" : "")}>{tg ? (diff < 0 ? `${yen(-diff)} 超過` : `残り ${yen(diff)}`) : "—"}</b></div>
              </div>
            </div>); })}
          <div className="brow2 total"><div className="brow2-g">
            <div><span>{partial ? "予算を入れた項目の予算" : "予算の合計"}</span><b className="mono">{yen(totalT)}</b></div>
            <div><span>{partial ? "その項目の見込み" : "見込みの合計"}</span><b className="mono">{yen(partial ? totalAT : totalA)}</b></div>
            <div><span>差額</span><b className={"mono" + (totalT && totalT - (partial ? totalAT : totalA) < 0 ? " over" : "")}>{totalT ? (totalT - (partial ? totalAT : totalA) < 0 ? `${yen((partial ? totalAT : totalA) - totalT)} 超過` : `残り ${yen(totalT - (partial ? totalAT : totalA))}`) : "—"}</b></div>
          </div></div>
          <button className="btn small" style={{ marginTop: 10 }} onClick={() => { const id = uid(); update(tr => ({ ...tr, budget: [...(tr.budget || []), { id, category: "", target: 0, auto: false, actual: 0 }] })); setEditRow(id); }}><Icon n="plus" s={14} />項目を追加</button>
        </section>
      </>}
      {mode === "split" && <>
        <section className="card stack" style={{ gap: 10 }}>
          <h3>参加者</h3>
          <div className="chips">
            {participants.map(p => renaming && renaming.from === p ? (
              <span key={p} className="member" style={{ paddingRight: 4 }}>
                <input className="input" style={{ minHeight: 28, width: 110, padding: "0 8px" }} aria-label={`${p}の新しい名前`} autoFocus value={renaming.to} onChange={e => setRenaming({ ...renaming, to: e.target.value })} onKeyDown={e => { if (e.key === "Enter") doRename(); if (e.key === "Escape") setRenaming(null); }} />
                <button aria-label="名前を変える" onClick={doRename}><Icon n="check" s={14} /></button>
              </span>
            ) : (
              <span key={p} className={"member" + (t.myName === p ? " me" : "")}>
                {p}
                <button aria-label={`${p}の名前を直す`} title="名前を直す" onClick={() => setRenaming({ from: p, to: p })}><Icon n="pencil" s={13} /></button>
                <button aria-label={t.myName === p ? "自分の設定を外す" : `${p}を自分にする`} title="自分にする" onClick={() => setMe(t.myName === p ? "" : p)}><Icon n="star" s={14} /></button>
                <button aria-label={`${p}を外す`} onClick={() => removeMember(p)}><Icon n="x" s={14} /></button>
              </span>
            ))}
            {!participants.length && <span className="small muted">まだ参加者がいません</span>}
          </div>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input className="input" aria-label="参加者の名前" placeholder="名前を追加" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMember()} />
            <button className="btn" onClick={addMember}>追加</button>
          </div>
          {typeof TrunkMemberSuggest === "function" && <TrunkMemberSuggest tripId={tripId} participants={participants} meName={t.myName} links={t.memberLinks || {}} onLink={(uid, n) => update(tr => {
            const links = { ...(tr.memberLinks || {}) };
            if (n) links[uid] = n; else delete links[uid];
            const ps = tr.participants || [];
            return { ...tr, participants: n && !ps.includes(n) ? [...ps, n] : ps, memberLinks: links };
          })} />}
          <div className="xs muted">★を押した人が「自分」です。支出を記録するとき、「払った人」の最初の値になります。</div>
        </section>
        <ExpenseSettle t={t} />
        {participants.length > 1 && !(t.expenses || []).length && <div className="note">「支出」に記録した支払いから、誰が誰にいくら払えばいいかを計算します。予約した宿や移動も、「支出」からワンボタンで入れられます。</div>}
      </>}
    </div>
  );
}

// ================= 持ち物 =================
function PackView({ t, update }) {
  const [bag, setBag] = useState("すべて");
  const [adding, setAdding] = useState("");
  const [addCat, setAddCat] = useState("");
  const [newCat, setNewCat] = useState("");
  // 消すのは、左にスワイプか長押しで出る「消す」から。消したあとは少しのあいだ「元に戻す」を出す
  const [rev, setRev] = useState(null);
  const [undo, setUndo] = useState(null);
  const touch = useRef(null), undoT = useRef(null);
  const swipeProps = (id) => ({
    onPointerDown: (e) => { const tm = setTimeout(() => { setRev(id); if (touch.current) touch.current.long = true; }, 550); touch.current = { x: e.clientX, y: e.clientY, tm, id }; },
    onPointerMove: (e) => { const c = touch.current; if (!c || c.id !== id) return; const dx = e.clientX - c.x, dy = e.clientY - c.y; if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(c.tm); if (dx < -40 && Math.abs(dy) < 30) setRev(id); if (dx > 40 && rev === id) setRev(null); },
    onPointerUp: () => { const c = touch.current; if (c) clearTimeout(c.tm); },
    onPointerCancel: () => { const c = touch.current; if (c) clearTimeout(c.tm); },
    onContextMenu: (e) => { e.preventDefault(); setRev(id); },
    // 長押しのあとに指を離したとき、チェックが切り替わらないようにする
    onClickCapture: (e) => { const c = touch.current; if (c && c.long && c.id === id) { e.preventDefault(); e.stopPropagation(); c.long = false; } },
  });
  const removeItem = (cat, i) => {
    const idx = (packing[cat] || []).findIndex(x => x.id === i.id);
    setItems(cat, xs => xs.filter(x => x.id !== i.id)); setRev(null);
    clearTimeout(undoT.current); setUndo({ cat, item: i, idx }); undoT.current = setTimeout(() => setUndo(null), 5000);
  };
  const undoRemove = () => { const u = undo; if (!u) return; setItems(u.cat, xs => xs.some(x => x.id === u.item.id) ? xs : [...xs.slice(0, u.idx), u.item, ...xs.slice(u.idx)]); setUndo(null); };
  const [bagEdit, setBagEdit] = useState(null); // null / { mode: "add" | "rename", name, from }
  const packing = t.packing || {};
  const all = Object.values(packing).flat();
  const done = all.filter(i => i.checked).length;
  const bags = Array.isArray(t.bags) ? t.bags : [];
  const sel = bags.includes(bag) || bag === "未定" ? bag : "すべて";
  const setItems = (cat, fn) => update(tr => ({ ...tr, packing: { ...tr.packing, [cat]: fn(tr.packing[cat] || []) } }));
  const mapAll = (tr, fn) => Object.fromEntries(Object.entries(tr.packing || {}).map(([c, xs]) => [c, xs.map(fn)]));
  const cats = Object.keys(packing);
  const curCat = cats.includes(addCat) ? addCat : cats[0] || "";
  const addItem = () => { const n = adding.trim(); if (!n || !curCat) return; setItems(curCat, items => [...items, { id: uid(), name: n, checked: false, bag: bags.includes(sel) ? sel : "" }]); setAdding(""); };
  const saveBag = () => {
    const n = (bagEdit.name || "").trim();
    if (!n || (bags.includes(n) && n !== bagEdit.from)) { setBagEdit(null); return; }
    if (bagEdit.mode === "add") update(tr => ({ ...tr, bags: [...(tr.bags || []), n] }));
    else update(tr => ({ ...tr, bags: (tr.bags || []).map(b => b === bagEdit.from ? n : b), packing: mapAll(tr, x => x.bag === bagEdit.from ? { ...x, bag: n } : x) }));
    setBag(n); setBagEdit(null);
  };
  const removeBag = (b) => { update(tr => ({ ...tr, bags: (tr.bags || []).filter(x => x !== b), packing: mapAll(tr, x => x.bag === b ? { ...x, bag: "" } : x) })); setBag("すべて"); };
  return (
    <div className="stack">
      <div className="row between" style={{ marginTop: 4 }}><h1>持ち物</h1><span className="mono small muted">{done}/{all.length}</span></div>
      <div className="bar" style={{ height: 8, margin: 0 }}><span style={{ width: `${all.length ? done / all.length * 100 : 0}%`, background: "var(--blue)" }} /></div>
      <div className="chips">
        {bags.length > 0 && ["すべて", ...bags, "未定"].map(b => <button key={b} className="chip" aria-pressed={sel === b} onClick={() => setBag(b)}>{b === "未定" ? "かばん未定" : b}</button>)}
        <button className="chip" onClick={() => setBagEdit({ mode: "add", name: "" })}><Icon n="plus" s={12} />{bags.length ? "かばん" : "かばんごとに分ける"}</button>
      </div>
      {cats.length > 0 && (
        <div className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
          <input className="input" style={{ flex: 1, minWidth: 0 }} aria-label="持ち物を追加" placeholder="持ち物を追加" value={adding} onChange={e => setAdding(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.nativeEvent.isComposing && addItem()} />
          <select className="input" aria-label="入れるカテゴリ" style={{ width: "auto", flex: "none", maxWidth: 110 }} value={curCat} onChange={e => setAddCat(e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select>
          <button className="btn" disabled={!adding.trim()} onClick={addItem}>追加</button>
        </div>
      )}
      {bagEdit && (
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input className="input" autoFocus aria-label="かばんの名前" placeholder="例：キャリーケース、機内持ち込み" value={bagEdit.name} onChange={e => setBagEdit({ ...bagEdit, name: e.target.value })} onKeyDown={e => e.key === "Enter" && saveBag()} />
          <button className="btn small" onClick={saveBag}>{bagEdit.mode === "add" ? "追加" : "変更"}</button>
          <button className="btn small ghost" onClick={() => setBagEdit(null)}>やめる</button>
        </div>
      )}
      {bags.includes(sel) && !bagEdit && (
        <div className="row small">
          <button className="btn small ghost" onClick={() => setBagEdit({ mode: "rename", name: sel, from: sel })}>「{sel}」の名前を変える</button>
          <button className="btn small ghost" style={{ color: "var(--danger)" }} onClick={() => removeBag(sel)}>このかばんを消す</button>
        </div>
      )}
      {Object.entries(packing).map(([cat, items]) => {
        const shown = items.filter(i => sel === "すべて" || (sel === "未定" ? !bags.includes(i.bag) : i.bag === sel));
        return (
          <section key={cat} className="card flush divide">
            <div className="row between" style={{ padding: "10px 14px" }}><h3>{cat}</h3><span className="mono xs muted">{items.filter(i => i.checked).length}/{items.length}</span></div>
            {!shown.length && <p className="xs muted" style={{ padding: "10px 14px", margin: 0 }}>まだありません。上の欄で「{cat}」を選んで追加できます。</p>}
            {shown.map(i => (
              <div key={i.id} className={"packitem" + (i.checked ? " done" : "") + (rev === i.id ? " rev" : "")} {...swipeProps(i.id)}>
                <input type="checkbox" aria-label={i.name} checked={!!i.checked} onChange={e => setItems(cat, xs => xs.map(x => x.id === i.id ? { ...x, checked: e.target.checked } : x))} />
                <span className="nm" style={{ minWidth: 0 }}>{i.name}</span>
                {bags.length > 0 ? <select className="input" aria-label="入れるかばん" style={{ width: "auto", fontSize: 12, padding: "4px 6px" }} value={bags.includes(i.bag) ? i.bag : ""} onChange={e => setItems(cat, xs => xs.map(x => x.id === i.id ? { ...x, bag: e.target.value } : x))}><option value="">未定</option>{bags.map(b => <option key={b}>{b}</option>)}</select> : <span />}
                {rev === i.id ? <span className="row" style={{ flexWrap: "nowrap", gap: 4 }}><button className="btn small" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "#fff" }} onClick={() => removeItem(cat, i)}>消す</button><button className="btn small ghost" onClick={() => setRev(null)}>やめる</button></span> : <span />}
              </div>
            ))}
          </section>
        );
      })}
      {typeof FEATURES !== "undefined" && typeof FEATURES.esimSearch === "function" && (() => {
        const u = FEATURES.esimSearch(staysOf(t).map(s => splitCity(s.city).main));
        return u && (
          <section className="card">
            <h3>海外での通信</h3>
            <p className="xs muted" style={{ margin: "4px 0 0" }}>現地でスマホを使うなら、eSIM を出発前に入れておくと着いてすぐつながります。</p>
            <AffLink href={u} label="AiraloでeSIMを探す" />
          </section>
        );
      })()}
      {all.length > 0 && <div className="xs muted" style={{ textAlign: "center" }}>消すときは、左にスワイプか長押し</div>}
      {undo && <div className="toast" role="status" style={{ display: "flex", gap: 12, alignItems: "center" }}>「{undo.item.name}」を消しました<button style={{ border: 0, background: "none", color: "#9CC3FF", fontWeight: 600, padding: 0, whiteSpace: "nowrap" }} onClick={undoRemove}>元に戻す</button></div>}
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <input className="input" aria-label="新しいカテゴリ" placeholder="カテゴリを追加（例：お土産）" value={newCat} onChange={e => setNewCat(e.target.value)} />
        <button className="btn" onClick={() => { const c = newCat.trim(); if (!c || packing[c]) return; update(tr => ({ ...tr, packing: { ...tr.packing, [c]: [] } })); setNewCat(""); }}>追加</button>
      </div>
    </div>
  );
}

// ================= 旅行の一覧・設定 =================
function tripStatusText(data) {
  const r = tripRange(data), today = todayISO();
  if (!r) return "日程未定";
  const d = dayDiff(today, r.start);
  if (d > 0) return `あと${d}日`;
  if (dayDiff(today, r.end) >= 0) return "旅行中";
  return "終了";
}
// 旅行の名前を空にしたときの名前（例：台北 2泊3日）
const autoTripName = (f) => { const d = splitCity(String(f.dest || "")).main.trim(); if (!d) return ""; const n = Number(f.nights) || 0; return n === 0 ? `${d} 日帰り` : `${d} ${n}泊${n + 1}日`; };
// 新しい旅行の入力欄の最初の値
const blankTripForm = () => ({ dest: "", scenes: [], name: "", start: "", nights: 2, label: "", home: FEATURES.homeAirport || "", idea: "", people: 1, names: [] });
// autoOpen：旅行がまだ1つもない人には、ボタンを押さなくても最初から入力欄を開いておく
function TripsSheet({ trips, currentId, onPick, onCreate, onSettings, limited, autoOpen }) {
  const [form, setForm] = useState(() => autoOpen ? blankTripForm() : null);
  const [busyCreate, setBusyCreate] = useState(false);
  const sorted = [...trips].sort((a, b) => { const ra = tripRange(a.data), rb = tripRange(b.data); return (ra ? ra.start : "9") < (rb ? rb.start : "9") ? -1 : 1; });
  return (
    <>
      {sorted.length > 0 && <div className="card flush divide">
        {sorted.map(x => { const r = tripRange(x.data); return (
          <button key={x.id} className="triprow" aria-current={x.id === currentId} onClick={() => onPick(x.id)}>
            <span style={{ minWidth: 0 }}><span className="t1" style={{ fontFamily: "var(--f-display)", fontWeight: 700 }}>{x.data.name}</span><span className="t2 mono">{r ? `${r.start.replace(/-/g, ".")} 〜 ${md(r.end)} ・ ${r.days}日間` : "日程未定"}</span></span>
            <span className="row" style={{ gap: 6, flex: "none" }}>{x.joined && <span className="pill tone-none">参加</span>}{x.pass && !x.joined && <span className="pill tone-booked">パス</span>}<span className="pill tone-none">{tripStatusText(x.data)}</span></span>
          </button>); })}
      </div>}
      {typeof TrunkPlanLine === "function" && trips.length > 0 && <TrunkPlanLine />}
      {limited && !form && <div className="note">{FREE_LIMIT_MSG}</div>}
      {limited && !form && typeof TrunkBuyPass === "function" && <TrunkBuyPass />}
      {!form && <div className="row"><button className="btn primary" disabled={limited} onClick={() => setForm(blankTripForm())}><Icon n="plus" s={16} />新しい旅行</button>{onSettings && <button className="btn" onClick={onSettings}>この旅行の設定</button>}</div>}
      {form && (
        <section className="card stack" style={{ gap: 10 }}>
          {!autoOpen && <h3>新しい旅行</h3>}
          <div className="fgrid">
            <Field label="行き先" wide><PlaceIn kind="city" value={form.dest} onChange={v => setForm({ ...form, dest: v })} onPick={(r, it) => setForm({ ...form, dest: it.main })} placeholder="例：台北、ソウル、京都" /></Field>
            <Field label="出発日" wide><DateIn value={form.start} onChange={v => setForm({ ...form, start: v })} /></Field>
            <Field label="泊数"><select value={form.nights} onChange={e => setForm({ ...form, nights: Number(e.target.value) })}>{Array.from({ length: 121 }, (_, i) => <option key={i} value={i}>{i === 0 ? "日帰り" : `${i}泊`}</option>)}</select></Field>
            {/* 長い旅行は「いつからいつまで」で考えることが多いので、帰る日でも決められるように（泊数と連動） */}
            <Field label="帰る日" opt><DateIn value={form.start ? addDays(form.start, Number(form.nights) || 0) : ""} onChange={v => { if (!form.start || !isISO(v)) return; const n = dayDiff(form.start, v); if (n >= 0 && n <= 120) setForm({ ...form, nights: n }); else if (n > 120) alert("120泊までの旅行が作れます。それより長い旅行は、いくつかの旅行に分けてください。"); }} /></Field>
            {FEATURES.mail && <Field label="Gmailのラベル（任意）"><TextIn value={form.label} onChange={v => setForm({ ...form, label: v })} placeholder="例：2027 TAIWAN" /></Field>}
            <Field label="どこから出発？" opt wide><PlaceIn value={form.home} onChange={v => setForm({ ...form, home: v })} onPick={(r, it) => setForm({ ...form, home: r.name || it.main })} options={AIRPORTS} placeholder="例：羽田空港(HND)、東京駅" /></Field>
            {form.home.trim() && form.dest.trim() && form.start && <div className="xs muted wide" style={{ marginTop: -4 }}>行きと帰りの移動を「未予約」で入れておきます。</div>}
            <Field label="人数" opt><select value={form.people || 1} onChange={e => setForm({ ...form, people: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}人</option>)}</select></Field>
            {(form.people || 1) > 1 && <Field label="名前（割り勘や持ち物に使います）" opt wide><div className="stack" style={{ gap: 6 }}>{Array.from({ length: form.people }, (_, i) => <TextIn key={i} value={(form.names || [])[i] || ""} onChange={v => { const n = [...(form.names || [])]; n[i] = v; setForm({ ...form, names: n }); }} placeholder={i === 0 ? "自分" : `同行者${i}`} />)}</div></Field>}
            <div className="field opt wide"><span>どんな旅にしたい？<em className="opt-tag">任意</em></span>
              <div className="chips">{TRIP_SCENES.map(k => { const on = (form.scenes || []).includes(k); return <button key={k} type="button" className="chip" aria-pressed={on} onClick={() => setForm(f => ({ ...f, scenes: (f.scenes || []).includes(k) ? f.scenes.filter(x => x !== k) : [...(f.scenes || []), k] }))}>{k}</button>; })}</div>
            </div>
            <Field label="旅行の名前" opt wide><TextIn value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder={autoTripName(form) || "空なら行き先と日数から付けます"} /></Field>
            {FEATURES.ai && <Field label="どんな旅行？（書くとClaudeが日程の下書きを作ります・任意）" wide><textarea value={form.idea} onChange={e => setForm({ ...form, idea: e.target.value })} placeholder="例：台北。夜市と温泉が好き。九份にも行きたい。のんびりめ" /></Field>}
          </div>
          {form.idea.trim() && !form.start && <div className="xs" style={{ color: "var(--orange)" }}>下書きを作るには出発日を入れてください</div>}
          <div className="row"><button className="btn primary" disabled={!(form.name.trim() || form.dest.trim()) || busyCreate} onClick={async () => { setBusyCreate(true); await onCreate(form); setBusyCreate(false); }}>{busyCreate ? "下書きを作っています…" : form.idea.trim() && form.start ? "下書きを作って作成" : "作成する"}</button>{!autoOpen && <button className="btn ghost" onClick={() => setForm(null)}>やめる</button>}</div>
        </section>
      )}
    </>
  );
}
function ShareSection({ t, onRequest, busy }) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(t.shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {} };
  return (
    <section className="stack" style={{ gap: 10 }}>
      <div className="formsec">共有ページ（見る専用・アカウント不要）</div>
      {t.shareUrl ? (
        <>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input className="input mono" style={{ fontSize: 12 }} readOnly value={t.shareUrl} aria-label="共有ページのURL" onFocus={e => e.target.select()} />
            <button className="btn small" onClick={copy}>{copied ? "コピーしました" : "コピー"}</button>
            <a className="btn small" href={safeUrl(t.shareUrl) || undefined} target="_blank" rel="noopener noreferrer"><Icon n="ext" s={14} /></a>
          </div>
          <div className="xs muted">最終更新 {t.shareUpdatedAt ? new Date(t.shareUpdatedAt).toLocaleString("ja-JP") : "—"}。旅程を変えたら、Claudeに「{t.name}の共有ページを更新して」と頼むと反映されます。</div>
        </>
      ) : (
        <div className="note">まだ共有ページがありません。Claudeに「{t.name}の共有ページを作って」と頼むと、この旅行だけを見せる閲覧専用のページができます。リンクを送れば、アカウントなしで開けます。</div>
      )}
      <Field label="LINEで届いたリクエストを貼り付けると、予定の候補にして「予約・手配」に並べます"><textarea value={text} onChange={e => setText(e.target.value)} placeholder="例：2日目に九份行きたい！夜は鼎泰豊がいいな（ゆうこ）" /></Field>
      <button className="btn" disabled={!text.trim() || busy} onClick={async () => { if (await onRequest(text)) setText(""); }}>{busy ? "読み取り中…" : "リクエストを取り込む"}</button>
    </section>
  );
}
// 日程をまとめてずらす（延期・前倒し）
function ShiftDates({ t, update }) {
  const r = tripRange(t);
  const [to, setTo] = useState("");
  const [done, setDone] = useState("");
  if (!r) return null;
  const diff = isISO(to) ? dayDiff(r.start, to) : 0;
  return (
    <section className="stack" style={{ gap: 8 }}>
      <div className="formsec">日程をまとめてずらす</div>
      <div className="small muted">今の日程：{r.start.replace(/-/g, ".")}（{wdOf(r.start)}）〜 {r.end.replace(/-/g, ".")}（{wdOf(r.end)}）・{r.days}日間</div>
      <div className="row" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label="新しい出発日"><DateIn value={to} onChange={v => { setTo(v); setDone(""); }} /></Field>
        <button className="btn primary" disabled={!diff} onClick={() => { update(tr => shiftTripData(tr, diff)); setDone(`${diff > 0 ? diff + "日後ろ" : -diff + "日前"}にずらしました`); setTo(""); }}>
          {diff ? `${diff > 0 ? diff + "日後ろ" : -diff + "日前"}にずらす` : "ずらす"}
        </button>
      </div>
      {diff !== 0 && <div className="xs muted">新しい日程：{addDays(r.start, diff).replace(/-/g, ".")} 〜 {addDays(r.end, diff).replace(/-/g, ".")}。宿・移動・予定の日付がまとめて動きます（支出の記録の日付は動きません）。</div>}
      {done && <div className="small muted">{done}</div>}
    </section>
  );
}
// 設定の画面：この旅行の設定／共有／アカウント（アカウントは Trunk. だけ）
// section："trip"（この旅行の設定）・"share"（共有）・"account"（プラン・要望・ログアウト）を、それぞれ別の画面として出す
const hasAccountSheet = () => typeof TrunkPlanSection === "function" || typeof TrunkFeedbackSection === "function" || !!FEATURES.account;
function SettingsSheet({ t, tripId, update, onCopy, onDelete, canDelete, onRequest, busy, joined, section }) {
  const hasPlan = typeof TrunkPlanSection === "function";
  const tab = section === "share" || section === "account" ? section : "trip";
  return (
    <>
      {tab === "trip" && <>
        <div className="fgrid">
          <Field label="旅行の名前" wide><TextIn value={t.name} onChange={v => update(tr => ({ ...tr, name: v }))} /></Field>
          {FEATURES.mail && <Field label="Gmailのラベル" wide><TextIn value={t.gmailLabel} onChange={v => update(tr => ({ ...tr, gmailLabel: v }))} placeholder="空ならキーワードで広く探す" /></Field>}
        </div>
        {FEATURES.mail && <div className="note">Gmailで予約メールにこのラベルを付けておくと、「予約・手配」の「Gmailから探す」でそのメールだけを読み取ります。読めるのは個人のGmailで、Claudeデスクトップアプリで開いたときだけです。</div>}
        <ShiftDates t={t} update={update} />
        <div className="formsec">コピー・削除</div>
        <button className="btn block" onClick={onCopy}>コピーして新しい旅行を作る</button>
        <div className="small muted">旅程・持ち物・予算の枠を引き継ぎます。実際の支出と共有リンクは引き継ぎません。</div>
        {joined ? <DeleteButton label="この旅行から抜ける" onDelete={onDelete} /> : canDelete ? <DeleteButton label="この旅行を削除" onDelete={onDelete} /> : <div className="small muted">旅行が1つだけのときは削除できません。</div>}
      </>}
      {tab === "share" && (FEATURES.claudeShare ? <ShareSection t={t} onRequest={onRequest} busy={busy} /> : typeof TrunkShareSection === "function" ? <TrunkShareSection t={t} tripId={tripId} /> : null)}
      {tab === "account" && hasPlan && <TrunkPlanSection />}
      {tab === "account" && <>
        {typeof TrunkFeedbackSection === "function" && <TrunkFeedbackSection />}
        {FEATURES.account && <><div className="formsec">アカウント</div><button className="btn block" onClick={() => Store.signOut()}>ログアウト</button></>}
      </>}
    </>
  );
}

// ================= 本体 =================
function App() {
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTabState] = useState(() => { const h = (location.hash || "").slice(1); return TABS.includes(h) ? h : "home"; });
  // window.__demo：紹介用の画面を撮るときだけ、最初に開く画面を決める（ふだんは空）
  const DEMO = window.__demo || {};
  const [planView, setPlanView] = useState(DEMO.view || "list");
  const [bookFilter, setBookFilter] = useState({ state: DEMO.book || "all", type: "all" });
  const [sheet, setSheet] = useState(DEMO.sheet ? { kind: DEMO.sheet } : null);
  const [menu, setMenu] = useState(false);
  const [menuData, setMenuData] = useState(false);
  const [moneyMode, setMoneyMode] = useState(null);
  // 「…」メニューは Escape キーでも閉じる
  useEffect(() => { if (!menu) return; const f = (e) => { if (e.key === "Escape") { setMenu(false); setMenuData(false); } }; document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f); }, [menu]);
  const [toastMsg, setToastMsg] = useState("");
  const [notice, setNotice] = useState("");
  const [privEm, setPrivEm] = useState({});
  const emTimer = useRef(null);
  useEffect(() => {
    if (!tripId || !Store.loadPrivate) return;
    let alive = true;
    Store.loadPrivate(tripId).then(e => { if (alive) setPrivEm(m => ({ ...m, [tripId]: e || {} })); }).catch(() => {});
    return () => { alive = false; };
  }, [tripId]);
  const [inboxAll, setInboxAll] = useState([]);
  // 転送で届いた予約メールの件数（Trunk. の予約メールの取り込み。なければ 0）
  const extInbox = typeof useTrunkInbound === "function" && FEATURES.mailImport ? useTrunkInbound(trips, tripId) : 0;
  const [scan, setScan] = useState({ st: "idle", msg: "", more: false });
  const [scrolled, setScrolled] = useState(false);
  // opsRef：まだ保存が終わっていない変更（関数）。同行者の保存と重なったときに、最新の内容へ重ね直すために取っておく
  const draftRef = useRef(null), idRef = useRef(null), lastSaved = useRef({}), opsRef = useRef({}), timer = useRef(null), migrated = useRef(false), fileRef = useRef(null);

  const toast = (m) => { setToastMsg(m); clearTimeout(toast.t); toast.t = setTimeout(() => setToastMsg(""), 2400); };
  const setTab = (k) => { setTabState(k); try { history.replaceState(null, "", "#" + k); } catch (e) {} window.scrollTo(0, 0); };
  useEffect(() => { const f = () => setScrolled(window.scrollY > 4); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);

  // 旅行一覧の読み込み（初回だけ旧版のデータを引き継ぐ）
  useEffect(() => {
    let unsub = null, gone = false;
    (async () => {
      await Store.init();
      if (gone) return;
      unsub = Store.watchTrips(async (list) => {
        if (!list.length && !migrated.current) {
          migrated.current = true;
          const id = await Store.migrateLegacy().catch(() => null);
          if (id) { rememberTrip(id); return; }
        }
        migrated.current = true;
        setTrips(list); setReady(true);
      }, (e) => { setLoadErr((e && e.code) || "error"); setReady(true); });
    })();
    return () => { gone = true; if (unsub) unsub(); };
  }, []);

  // 表示する旅行を決め、ほかの端末での変更を取り込む
  useEffect(() => {
    if (!trips.length) return;
    let id = tripId && trips.some(x => x.id === tripId) ? tripId : null;
    if (!id) {
      const saved = recallTrip();
      if (saved && trips.some(x => x.id === saved)) id = saved;
      else {
        const today = todayISO();
        const upcoming = trips.map(x => ({ id: x.id, r: tripRange(x.data) })).filter(x => x.r && x.r.end >= today).sort((a, b) => a.r.start < b.r.start ? -1 : 1);
        id = upcoming.length ? upcoming[0].id : trips[0].id;
      }
    }
    const cur = trips.find(x => x.id === id);
    const json = JSON.stringify(cur.data);
    if (id !== idRef.current) {
      idRef.current = id; setTripId(id); lastSaved.current[id] = json;
      const d = upgradeTrip(cur.data); draftRef.current = d; setDraft(d);
    } else if (json !== lastSaved.current[id] && json !== JSON.stringify(draftRef.current)) {
      const a = document.activeElement;
      if (a && ["INPUT", "TEXTAREA", "SELECT"].includes(a.tagName)) return;
      lastSaved.current[id] = json;
      const pending = opsRef.current[id] || [];
      const d = pending.reduce((x, f) => { try { return f(x); } catch (e) { return x; } }, upgradeTrip(cur.data));
      draftRef.current = d; setDraft(d);
    }
  }, [trips, tripId]);

  useEffect(() => {
    if (!tripId || !draftRef.current) return;
    const r = tripRange(draftRef.current);
    setPlanView(r && r.days > 14 ? "list" : "day");
  }, [tripId]);

  // 取り込み候補
  useEffect(() => {
    if (!tripId) return;
    setInboxAll([]); setScan({ st: "idle", msg: "", more: false });
    return Store.watchInbox(tripId, setInboxAll);
  }, [tripId]);
  // フレーズ集（旅行ごとに別の場所に保存）
  const [phraseDocs, setPhraseDocs] = useState([]);
  useEffect(() => { if (!tripId) return; setPhraseDocs([]); return Store.watchPhrases(tripId, setPhraseDocs); }, [tripId]);
  // 旧版で旅行データの中に入っていたフレーズ集は、その旅行の言語のものだけ別の場所へ移す
  useEffect(() => {
    const d = draftRef.current, id = idRef.current;
    if (FEATURES.phrasesInTrip || !d || !id || !d.phrases || !Object.keys(d.phrases).length) return;
    const mine = new Set(tripLanguages(d).map(l => l.lang));
    (async () => {
      for (const p of Object.values(d.phrases)) if (mine.has(p.lang)) await Store.setPhrase(id, p).catch(() => {});
      update(tr => { const { phrases, ...rest } = tr; return rest; });
    })();
  }, [tripId, draft && draft.phrases]);
  const inbox = inboxAll.filter(x => x && x.status === "pending" && x.extracted).sort((a, b) => (a.receivedAt || "").localeCompare(b.receivedAt || ""));

  // パスが外れる・新しい旅行として数える変更は、保存の前に確かめる（Trunk. の Store.checkChange）
  const [confirmBox, setConfirmBox] = useState(null);
  const save = (id, data, sure) => {
    const w = !sure && Store.checkChange ? Store.checkChange(id, data) : null;
    if (w && w.kind !== "postpone") { setConfirmBox({ id, data, msg: w.msg }); return Promise.resolve(); }
    if (w && w.kind === "postpone") {
      toast("延期として保存しました（出発後の延期は1つの旅行で1回までです）");
      const m = Store.meta && Store.meta.get(id); if (m) { m.postponed = true; m.startedOn = null; m.plannedEnd = null; }
    }
    const batch = [...(opsRef.current[id] || [])]; // 写しを取る（このあと増える変更は次の保存に回す）
    const json = JSON.stringify(data);
    lastSaved.current[id] = json;
    return Store.saveTrip(id, JSON.parse(json), batch).then(saved => {
      // この保存に含めた変更だけを外す（保存は順番待ちするので、その間に増えた変更は残す）
      opsRef.current[id] = (opsRef.current[id] || []).filter(f => !batch.includes(f));
      // 同行者の保存と重なって重ね直したときは、その内容に、まだ保存していない変更を足して画面に出す
      if (saved && JSON.stringify(saved) !== json) {
        lastSaved.current[id] = JSON.stringify(saved);
        if (idRef.current === id) {
          const d = opsRef.current[id].reduce((x, f) => { try { return f(x); } catch (e) { return x; } }, saved);
          draftRef.current = d; setDraft(d);
        }
      }
    }, e => {
      if (e && e.code === "trip_limit") { opsRef.current[id] = []; setNotice(TRIP_RENEW_MSG); }
      else if (e && e.code === "too_large") { opsRef.current[id] = []; setNotice(e.msg); }
      else if (e && e.code === "gone") { opsRef.current[id] = []; setNotice("この旅行は、作った人が削除したか、同行者から外されました。"); }
      else toast(e && e.code === "quota_exceeded" ? "保存できる容量を超えました" : "保存できませんでした。もう一度お試しください");
    });
  };
  const update = (fn) => {
    const id = idRef.current;
    const next = fn(draftRef.current);
    draftRef.current = next; setDraft(next);
    (opsRef.current[id] = opsRef.current[id] || []).push(fn);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; save(id, next); }, 500);
  };
  const flushNow = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; const id = idRef.current, d = draftRef.current; if (id && d) save(id, d); } };
  const pickTrip = (id) => { flushNow(); rememberTrip(id); idRef.current = null; setTripId(id); setSheet(null); setTab("home"); };
  // パス（使っていない旅行パス、期間中の3か月パス）があれば、枠を超えても作れる（Trunk. の Store.canExceed）
  const atLimit = !!FEATURES.freeLimit && activeTripCount(trips) >= FEATURES.freeLimit && !(Store.canExceed && Store.canExceed());
  const createTrip = async (form) => {
    if (atLimit) { toast("無料版では旅行は1つずつです"); return; }
    flushNow();
    const id = FEATURES.newId ? FEATURES.newId() : "t-" + Date.now().toString(36);
    const dest = String(form.dest || "").trim(), home = String(form.home || "").trim();
    let data = { ...emptyTrip(form.name.trim() || autoTripName(form) || "新しい旅行", form.start || "", form.nights), gmailLabel: (form.label || "").trim(), startGuide: true };
    // 行き先：最初の滞在の都市にする。出発地もあれば、行きと帰りの移動を「未予約」で入れる
    if (dest) data = { ...data, itinerary: data.itinerary.map((x, i) => i === 0 && x.type === "stay" ? { ...x, city: dest } : x) };
    if ((form.scenes || []).length) data = { ...data, scenes: form.scenes };
    if (dest && home && form.start) {
      const last = addDays(form.start, Number(form.nights) || 0);
      const mv = (from, to, d) => ({ id: uid(), type: "transit", mode: "未定", desc: "", fromCity: from, toCity: to, departDate: d, departTime: "", departTZ: 9, arriveDate: d, arriveTime: "", arriveTZ: 9, airline: "", transitStops: "", cls: "", price: 0, miles: false, memo: "", status: "候補", paymentStatus: "未払い", needsBooking: true });
      data = { ...data, itinerary: normalizeItinerary([...data.itinerary, mv(home, dest, form.start), mv(dest, home, last)]) };
    }
    // 人数と名前：2人以上なら参加者を作る（名前がなければ「自分」「同行者1」…）。最初の人が自分
    if ((form.people || 1) > 1) {
      const names = Array.from({ length: form.people }, (_, i) => String((form.names || [])[i] || "").trim() || (i === 0 ? "自分" : `同行者${i}`));
      const uniq = names.map((n, i) => names.indexOf(n) === i ? n : `${n}${i + 1}`);
      data = { ...data, participants: uniq, myName: uniq[0] };
    }
    let drafted = false;
    if (form.idea && form.idea.trim() && form.start) {
      const sample = await useCap("sample");
      if (sample) {
        try {
          const d = await sample.json(tripDraftPrompt({ ...form, name: form.name.trim() }), { modelTier: "default" });
          const next = applyTripDraft({ ...data, itinerary: [] }, d, form.start);
          if (staysOf(next).length) { data = next; drafted = true; }
        } catch (e) {}
      }
    }
    await Store.saveTrip(id, data).catch(() => {});
    track("trip_create", { source: drafted ? "ai_draft" : "blank", people: form.people || 1 });
    rememberTrip(id); idRef.current = null; setTripId(id); setSheet(null); setTab(drafted ? "plan" : "home"); toast(drafted ? "日程の下書きを入れて旅行を作りました" : form.idea && form.idea.trim() ? "旅行を作りました（下書きは作れませんでした）" : "旅行を作りました");
  };
  const copyTrip = async () => {
    flushNow();
    const src = draftRef.current; if (!src) return;
    const data = copyTripData(src);
    if (atLimit && isActiveTrip(data)) { setNotice(FREE_LIMIT_MSG); return; }
    const id = FEATURES.newId ? FEATURES.newId() : "t-" + Date.now().toString(36);
    try { await Store.saveTrip(id, data); }
    catch (e) { setNotice(e && e.code === "trip_limit" ? FREE_LIMIT_MSG : "コピーできませんでした。もう一度お試しください"); return; }
    track("trip_create", { source: "copy" });
    rememberTrip(id); idRef.current = null; setTripId(id); setSheet(null); setTab("plan"); toast("コピーして新しい旅行を作りました。日程を直してください");
  };
  const deleteTrip = async () => {
    const id = idRef.current; const other = trips.find(x => x.id !== id);
    const wasJoined = !!(Store.isJoined && Store.isJoined(id));
    clearTimeout(timer.current);
    await Store.deleteTrip(id).catch(() => {});
    if (other) { rememberTrip(other.id); idRef.current = null; setTripId(other.id); }
    setSheet(null); toast(wasJoined ? "旅行から抜けました" : "旅行を削除しました");
  };

  // 追加
  const addStay = () => {
    const t = draftRef.current, stays = sortItinerary(staysOf(t)).filter(s => isISO(s.startDate));
    const last = stays[stays.length - 1];
    const s = { id: uid(), type: "stay", city: "", startDate: last ? stayEnd(last) : todayISO(), nights: 1, memo: "", status: "未確定", noHotel: false };
    setSheet({ kind: "stay", id: s.id, pending: s });
  };
  const addTransit = (date, back, o) => {
    const t = draftRef.current, stays = sortItinerary(staysOf(t)).filter(s => isISO(s.startDate)), last = stays[stays.length - 1];
    const onDay = isISO(date), mvs = transitsOf(t).filter(r => !r.local), endD = last ? stayEnd(last) : "", rng = tripRange(t);
    const kind = onDay ? "day" : !mvs.length && rng ? "first" : endD && !mvs.some(r => r.departDate === endD) ? "return" : rng ? "other" : "return";
    const d = onDay ? date : kind === "first" || kind === "other" ? rng.start : endD || todayISO();
    const here = onDay ? stays.find(s => d >= s.startDate && d < stayEnd(s)) : null;
    const x = { id: uid(), type: "transit", mode: kind === "first" || kind === "return" ? "飛行機" : "未定", desc: "", fromCity: o && o.from ? o.from : onDay ? (here ? here.city : "") : kind === "return" && last ? last.city : "", toCity: (o && o.to) || "", departDate: d, departTime: (o && o.time) || "", departTZ: 9, arriveDate: d, arriveTime: "", arriveTZ: 9, airline: "", transitStops: "", cls: "", price: 0, miles: false, memo: "", status: "候補", paymentStatus: "未払い" };
    setSheet({ kind: "transit", id: x.id, back, init: JSON.stringify(x), fresh: !!onDay, opts: o || null, pending: x });
  };
  // 追加したばかりの予定と移動を切り替える。入れた日付・時刻・場所は引き継ぐ
  // その日の夜の宿を入れる：泊まる滞在があればそれを開き、なければその日から1泊の滞在を作って開く
  const addStayOn = (date, back) => {
    const tr0 = draftRef.current, stays = sortItinerary(staysOf(tr0)).filter(s => isISO(s.startDate));
    const d = isISO(date) ? date : todayISO();
    const cur = stays.find(s => d >= s.startDate && d < stayEnd(s));
    if (cur) { setSheet({ kind: "stay", id: cur.id, back }); return; }
    const prev = [...stays].reverse().find(s => stayEnd(s) <= d), next = stays.find(s => s.startDate > d);
    const nights = next ? Math.max(1, dayDiff(d, next.startDate)) : 1;
    const s = { id: uid(), type: "stay", city: (prev || next || {}).city || "", startDate: d, nights, memo: "", status: "未確定", noHotel: false };
    setSheet({ kind: "stay", id: s.id, back, pending: s });
  };
  const switchNew = (to) => {
    if (!sheet || !sheet.fresh || sheet.kind === to) return;
    const tr0 = withPending(draftRef.current), o = sheet.opts || {};
    if (to === "stay") {
      const l = (tr0.localTransport || []).find(x => x.id === sheet.id), x = (tr0.itinerary || []).find(r => r.id === sheet.id);
      if (l) update(tr => ({ ...tr, localTransport: (tr.localTransport || []).filter(y => y.id !== l.id) }));
      if (x) update(tr => ({ ...tr, itinerary: tr.itinerary.filter(r => r.id !== x.id) }));
      addStayOn(l ? l.date : x ? x.departDate : "", sheet.back);
      return;
    }
    if (to === "transit") {
      const l = (tr0.localTransport || []).find(x => x.id === sheet.id);
      if (!l) return;
      update(tr => ({ ...tr, localTransport: (tr.localTransport || []).filter(x => x.id !== l.id) }));
      addTransit(l.date, sheet.back, { time: l.startTime || o.time || "", from: o.from || "", to: o.to || l.address || "" });
    } else {
      const x = (tr0.itinerary || []).find(r => r.id === sheet.id);
      if (!x) return;
      update(tr => ({ ...tr, itinerary: tr.itinerary.filter(r => r.id !== x.id) }));
      addLocal(x.departDate, sheet.back, { time: x.departTime || o.time || "", from: o.from, to: o.to });
    }
  };
  const addLocal = (date, back, o) => {
    const tr0 = draftRef.current, r = tripRange(tr0);
    const d = isISO(date) ? date : r ? r.start : todayISO();
    const stay = staysOf(tr0).find(s => s.startDate && d >= s.startDate && d < stayEnd(s));
    const l = { id: uid(), linkedStayId: stay ? stay.id : null, category: "観光", desc: "", address: "", fromAddress: "", toAddress: "", date: d, startTime: (o && o.time) || "", endTime: "", mode: "", price: 0, people: 1, needsBooking: false, memo: "", paymentStatus: "未払い", status: "候補" };
    // 移動の目安から押したときは、画面を開かずにそのまま入れる
    if (o && o.stay) { addStayOn(d, back); return; }
    if (o && o.hideHint) { update(tr => ({ ...tr, moveHintsOff: [...new Set([...(tr.moveHintsOff || []), o.hideHint])] })); return; }
    // 移動の目安から押したときは、画面を開かずに「街の中の移動」としてそのまま入れる
    if (o && o.quick) {
      const q = o.quick, mode = q.mode === "電車" ? "鉄道" : q.mode;
      const same = transitsOf(tr0).some(x => x.departDate === d && x.fromCity === q.fromAddress && x.toCity === q.toAddress && (x.departTime || "") === (q.startTime || ""));
      if (same) { toast("同じ移動がもう入っています"); return; }
      const x = { id: uid(), type: "transit", local: true, mode, desc: "", fromCity: q.fromAddress, toCity: q.toAddress, departDate: d, departTime: q.startTime || "", departTZ: 9, arriveDate: d, arriveTime: q.endTime || "", arriveTZ: 9, airline: "", transitStops: "", cls: "", price: 0, miles: false, memo: "", status: "候補", paymentStatus: "未払い", needsBooking: false };
      update(tr => ({ ...tr, itinerary: normalizeItinerary([...tr.itinerary, x]) })); toast(`${q.mode}の移動を入れました（目安の時間です）`); return;
    }
    setSheet({ kind: "local", id: l.id, back, fresh: true, opts: o || null, init: JSON.stringify(l), pending: l });
  };

  // 予約メール
  const errText = (e) => {
    const c = e && e.code, m = (e && e.message) || "";
    if (c === "server_not_connected" || c === "server_not_found") return "個人のGmailは、Claudeデスクトップアプリでこのページを開いたときだけ読めます（Google Workspace MCP 拡張機能を使います）。";
    if (c === "tool_error" && /Authentication|ACTION REQUIRED/i.test(m)) return "Googleの認証が必要です。ブラウザに開いたGoogleの画面で許可してから、もう一度押してください。";
    if (c === "tool_error") return `Gmailの読み取りでエラーが出ました（${m.slice(0, 120)}）`;
    if (c === "not_granted" || c === "not_in_manifest") return "GmailかClaudeの利用が許可されませんでした。ページの権限メニューから許可できます。";
    if (c === "rate_limited") return "Claudeの利用が混み合っています。少し待ってからもう一度押してください。";
    return `読み取りの途中で止まりました（${c || m || "不明なエラー"}）。もう一度押すと続きから読み取ります。`;
  };
  const scanGmail = async () => {
    if (scan.st === "busy") return;
    const [mcp, sample] = await Promise.all([useCap("mcp"), useCap("sample")]);
    if (!mcp || !sample) { setScan({ st: "err", msg: "この表示ではGmailとの連携が使えません。Claudeデスクトップアプリでこのページを開いてください。", more: false }); return; }
    const tid = idRef.current, t = draftRef.current;
    setScan({ st: "busy", msg: "Gmailを検索しています…", more: false });
    try {
      const { srv, res } = await searchPersonalGmail(mcp, { query: gmailQueryFor(t.gmailLabel), user_google_email: PERSONAL_GMAIL, page_size: 40, include_headers: true });
      const found = parseGmailSearch(mcpText(res));
      const done = await Store.inboxIds(tid);
      const todo = found.filter(m => !done.has(m.id)), batch = todo.slice(0, SCAN_BATCH);
      let added = 0;
      for (let i = 0; i < batch.length; i++) {
        const m = batch[i];
        setScan({ st: "busy", msg: `メールを読み取っています（${i + 1}/${batch.length}）：${m.subject}`, more: false });
        const body = await mcp.callTool(srv, "get_gmail_message_content", { message_id: m.id, user_google_email: PERSONAL_GMAIL });
        const ex = normalizeBooking(await sample.json(bookingPrompt({ subject: m.subject, from: m.from, date: m.date, body: mcpText(body) }, t), { modelTier: "default" }));
        await Store.setInbox(tid, m.id, { gmailId: m.id, subject: m.subject || "", from: m.from || "", receivedAt: m.isoDate || "", url: m.url || "", status: ex ? "pending" : "ignored", extracted: ex, createdAt: new Date().toISOString() });
        if (ex) added++;
      }
      const rest = todo.length - batch.length;
      setScan({ st: "ok", more: rest > 0, msg: batch.length === 0 ? (t.gmailLabel ? `ラベル「${t.gmailLabel}」に新しいメールはありませんでした。` : "新しい予約メールはありませんでした。") : `${batch.length}通を読み取り、予約は${added}件ありました。${rest > 0 ? `まだ${rest}通残っています。` : ""}` });
    } catch (e) { setScan({ st: "err", msg: errText(e), more: false }); }
  };
  const pasteImport = async (text) => {
    const sample = await useCap("sample");
    if (!sample) { setScan({ st: "err", msg: "この表示ではClaudeを呼び出せません。claude.ai でこのページを開いてください。", more: false }); return false; }
    const tid = idRef.current, t = draftRef.current;
    setScan({ st: "busy", msg: "貼り付けた本文を読み取っています…", more: false });
    try {
      const ex = normalizeBooking(await sample.json(bookingPrompt({ subject: "（貼り付けたメール）", from: "", date: todayISO(), body: text }, t), { modelTier: "default" }));
      if (!ex) { setScan({ st: "ok", msg: "この旅行の予約の内容は見つかりませんでした。", more: false }); return false; }
      const id = "paste-" + Date.now();
      await Store.setInbox(tid, id, { gmailId: id, subject: ex.summary || "貼り付けたメール", from: "貼り付け", receivedAt: new Date().toISOString(), url: "", status: "pending", extracted: ex, createdAt: new Date().toISOString() });
      setScan({ st: "ok", msg: "読み取りました。下の取り込み候補を確認してください。", more: false });
      return true;
    } catch (e) { setScan({ st: "err", msg: errText(e), more: false }); return false; }
  };
  const importRequest = async (text) => {
    const sample = await useCap("sample");
    if (!sample) { toast("この表示ではClaudeを呼び出せません"); return false; }
    const tid = idRef.current, t = draftRef.current;
    setScan({ st: "busy", msg: "リクエストを読み取っています…", more: false });
    try {
      const res = await sample.json(requestPrompt(text, t), { modelTier: "default" });
      const items = (res && Array.isArray(res.items) ? res.items : []).filter(x => x && x.title);
      if (!items.length) { setScan({ st: "ok", msg: "予定になりそうな内容が見つかりませんでした。", more: false }); toast("予定は見つかりませんでした"); return false; }
      const from = String((res && res.from) || "").trim();
      for (let i = 0; i < items.length; i++) {
        const it = items[i], id = `req-${Date.now()}-${i}`;
        await Store.setInbox(tid, id, { gmailId: id, subject: `リクエスト：${it.title}`, from: from ? `${from}さん（共有ページ）` : "共有ページ", receivedAt: new Date().toISOString(), url: "", status: "pending", createdAt: new Date().toISOString(),
          extracted: { ...BOOKING_DEFAULTS, kind: "activity", booking_status: "pending", is_request: true, summary: `リクエスト：${it.title}`, name: String(it.title), category: String(it.category || ""), activity_date: isISO(it.date) ? it.date : "", activity_time: /^\d{1,2}:\d{2}$/.test(it.time || "") ? it.time : "", address: String(it.address || ""), note: String(it.note || ""), provider: from } });
      }
      setScan({ st: "ok", msg: `リクエストから${items.length}件の予定候補を作りました。「予約・手配」で確認してください。`, more: false });
      toast(`${items.length}件の候補を「予約・手配」に追加しました`);
      return true;
    } catch (e) { setScan({ st: "err", msg: errText(e), more: false }); return false; }
  };
  const [guessing, setGuessing] = useState(false);
  const guessGeo = async () => {
    const names = unknownPlaces(draftRef.current);
    if (!names.length) return;
    const sample = await useCap("sample");
    if (!sample) { toast("この表示ではClaudeを呼び出せません"); return; }
    setGuessing(true);
    try {
      const res = await sample.json(geoPrompt(names), { modelTier: "quick" });
      const add = {};
      Object.entries(res || {}).forEach(([k, v]) => { if (Array.isArray(v) && v.length === 2 && isFinite(v[0]) && isFinite(v[1]) && Math.abs(v[0]) <= 90 && Math.abs(v[1]) <= 180) add[k] = [Number(v[0]), Number(v[1])]; });
      if (Object.keys(add).length) { update(tr => ({ ...tr, geo: { ...(tr.geo || {}), ...add } })); toast(`${Object.keys(add).length}か所の位置を地図に追加しました`); }
      else toast("位置を推測できませんでした");
    } catch (e) { toast("位置を推測できませんでした"); }
    setGuessing(false);
  };
  const decide = (id, status) => Store.updateInbox(idRef.current, id, { status, decidedAt: new Date().toISOString() }).catch(() => {});
  const applyInbox = (item, p) => { update(p.apply); decide(item.gmailId, "applied"); toast("旅程に反映しました"); };

  // メニュー
  const exportJSON = async () => { setMenu(false); const t = draftRef.current; if (!(await saveFile(`${t.name || "trip"}.json`, new Blob([JSON.stringify({ ...t, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" })))) toast("この表示ではファイルを保存できません"); };
  const exportICS = async () => { setMenu(false); const t = draftRef.current; if (!(await saveFile(`${t.name || "trip"}.ics`, new Blob([buildICS(t)], { type: "text/calendar;charset=utf-8" })))) toast("この表示ではファイルを保存できません"); };
  const copySummary = async () => { setMenu(false); try { await navigator.clipboard.writeText(buildSummaryText(draftRef.current)); toast("旅程の要約をコピーしました"); } catch (e) { toast("コピーできませんでした"); } };
  const onImportFile = (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { const d = JSON.parse(rd.result); if (!Array.isArray(d.itinerary)) throw 0; setSheet({ kind: "import", data: d }); } catch (err) { toast("読み込めませんでした。書き出したJSONファイルを選んでください"); } };
    rd.readAsText(f);
  };

  const onTodo = (td) => { if (td.edit) setSheet(td.edit); else if (td.go) { if (td.go.tab === "book") setBookFilter({ state: td.go.filter || "open", type: td.go.type || "all" }); setTab(td.go.tab); } };

  if (!ready) return <div className="empty" style={{ paddingTop: 80 }}>読み込み中…</div>;
  if (loadErr && !trips.length) return <div className="main"><div className="err" style={{ marginTop: 40 }}>旅行のデータを読み込めませんでした（{loadErr}）。ページを開き直してください。</div></div>;
  if (!trips.length) return (
    <div className="main" style={{ paddingTop: 48 }}>
      <div className="card stack">
        <h1>どこへ行きますか？</h1>
        <p className="muted">行き先と日にちを入れるだけで、旅行の枠ができます。宿・移動・1日の予定は、あとから少しずつ足していけます。</p>
        <TripsSheet trips={[]} currentId={null} onPick={() => {}} onCreate={createTrip} onSettings={null} autoOpen />
        {FEATURES.demoUrl && <a className="small" href={FEATURES.demoUrl}>先に見本の旅行を見てみる →</a>}
      </div>
      {FEATURES.account && <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => Store.signOut()}>ログアウト</button>}
    </div>
  );
  if (!draft) return <div className="empty" style={{ paddingTop: 80 }}>読み込み中…</div>;

  const t = withCustomPhrases(withBuiltinPhrases({ ...draft, phrases: { ...(draft.phrases || {}), ...Object.fromEntries(phraseDocs.map(p => [p.lang, p])) } }));
  // 緊急時の情報は人ごと（Trunk. の Store.loadPrivate）：一緒に編集する人にも見えない表に置く
  const priv = Store.loadPrivate ? (privEm[tripId] || {}) : null;
  const emT = priv ? { ...t, emergency: priv } : t;
  const emUpdate = priv ? (fn) => {
    const cur = { ...draftRef.current, emergency: privEm[tripId] || {} };
    const nextEm = fn(cur).emergency || {};
    setPrivEm(m => ({ ...m, [tripId]: nextEm }));
    clearTimeout(emTimer.current);
    emTimer.current = setTimeout(() => Store.savePrivate(tripId, nextEm).catch(() => toast("緊急時の情報を保存できませんでした")), 500);
    // 国ごとの連絡先など、緊急時の情報以外の変更は旅行の中身へ
    update(tr => { const { emergency, ...rest } = fn({ ...tr, emergency: nextEm }); return rest; });
  } : update;
  // 持ち物は人ごと：同行者として参加した旅行では、自分の分（packingBy[自分のID]）を見せて、そこにだけ書く。作った人は今まで通り t.packing
  const me = Store.userId && Store.userId(), packMine = !!(me && Store.isJoined && Store.isJoined(tripId));
  const mineOf = (tr) => ((tr.packingBy || {})[me]) || { packing: {}, bags: [] };
  const packT = packMine ? { ...t, packing: mineOf(t).packing, bags: mineOf(t).bags } : t;
  const packUpdate = packMine ? (fn) => update(tr => {
    const m = mineOf(tr), r = fn({ ...tr, packing: m.packing, bags: m.bags });
    return { ...tr, packingBy: { ...(tr.packingBy || {}), [me]: { packing: r.packing || {}, bags: r.bags || [] } } };
  }) : update;
  const sugg = buildSuggestions([t, ...trips.filter(x => x.id !== tripId).map(x => x.data)]);
  const stats = tripStats(t);
  const todos = buildTodos(priv ? { ...t, emergency: priv } : t, inbox.length + extInbox);
  // 精算の「自分」：Trunk. では、ログインしている人ごとに、結びつけた参加者が自分になる（memberLinks）。なければ旅行の myName
  const meName = typeof trunkMyName === "function" ? trunkMyName(t, tripId) : (t.myName || "");
  const setMe = (name) => update(tr => typeof trunkSetMe === "function" ? trunkSetMe(tr, name) : ({ ...tr, myName: name }));
  const mine = myShare(t);
  const openDay = (iso) => setSheet({ kind: "day", iso });
  // 追加の画面で開いている、まだ旅行に入っていない下書き（最初に何か変えたときに入れる）
  const hasItem = (tr, x) => x.type === "stay" || x.type === "transit" ? (tr.itinerary || []).some(r => r.id === x.id) : (tr.localTransport || []).some(r => r.id === x.id);
  const putItem = (tr, x) => x.type === "stay" || x.type === "transit" ? { ...tr, itinerary: normalizeItinerary([...(tr.itinerary || []), x]) } : { ...tr, localTransport: [...(tr.localTransport || []), x] };
  const withPending = (tr) => sheet && sheet.pending && tr && !hasItem(tr, sheet.pending) ? putItem(tr, sheet.pending) : tr;
  const pendUpdate = (fn) => { const x = sheet && sheet.pending; update(tr => fn(x && !hasItem(tr, x) ? putItem(tr, x) : tr)); };
  const closeSheet = () => {
    let removedMove = false;
    // 何も入力せずに閉じた予定は残さない
    if (sheet && sheet.kind === "local") {
      const l = (draftRef.current.localTransport || []).find(x => x.id === sheet.id);
      const lk = ["desc", "address", "category", "date", "startTime", "endTime", "price", "memo", "status", "paymentStatus", "needsBooking"];
      const lpick = (o) => JSON.stringify(lk.map(k => o[k] == null ? "" : String(o[k])));
      const untouched = l && sheet.init && lpick(l) === lpick(JSON.parse(sheet.init));
      if (l && (untouched || (!String(l.desc || "").trim() && !l.startTime && !Number(l.price) && !String(l.memo || "").trim()))) update(tr => ({ ...tr, localTransport: tr.localTransport.filter(x => x.id !== sheet.id) }));
    }
    // 追加したまま何も変えずに閉じた移動も残さない（「＋」で前後の場所や時刻が入っていても、触っていなければ消す）
    if (sheet && sheet.kind === "transit" && sheet.init) {
      const x = (draftRef.current.itinerary || []).find(r => r.id === sheet.id);
      const empty = x && !String(x.toCity || "").trim() && !x.departTime && !Number(x.price) && !String(x.airline || "").trim() && !String(x.desc || "").trim() && !String(x.memo || "").trim();
      const keys = ["fromCity", "toCity", "mode", "departDate", "departTime", "arriveTime", "airline", "desc", "price", "cls", "memo", "status", "paymentStatus"];
      const pick = (o) => JSON.stringify(keys.map(k => o[k] == null ? "" : String(o[k])));
      if (x && (empty || pick(x) === pick(JSON.parse(sheet.init)))) { removedMove = true; update(tr => ({ ...tr, itinerary: tr.itinerary.filter(r => r.id !== sheet.id) })); }
    }
    // 滞在の途中で別の都市へ移る移動なら、その日から滞在を分ける（何も入れずに消した移動では分けない）
    if (sheet && sheet.kind === "transit" && !removedMove) {
      const sp = splitStaysByMove(draftRef.current, sheet.id);
      if (sp) { update(tr => { const r = splitStaysByMove(tr, sheet.id); return r ? r.trip : tr; }); toast(`${md(sp.date)}から${sp.city}の滞在にしました（${sp.from}の宿は${md(sp.date)}にチェックアウト）`); }
    }
    setSheet(sheet && sheet.back ? { kind: "day", iso: sheet.back } : null);
  };
  const openCount = staysOf(t).filter(s => isOpenState(stayState(t, s))).length + transitsOf(t).filter(x => isOpenState(transitState(x))).length + (t.localTransport || []).filter(l => isOpenState(localState(l))).length;
  const mail = <MailCard t={t} update={update} inbox={inbox} scan={scan} onScan={scanGmail} onPaste={pasteImport} onApply={applyInbox} onDecide={decide} />;
  const sheetTitle = sheet && ({ stay: "滞在と宿", transit: "移動", local: "予定", trips: "旅行", shift: "日程をずらす", settings: sheet.section === "share" ? "共有" : sheet.section === "account" ? "アカウント" : "この旅行の設定", import: "ファイルの読み込み", add: "追加する", day: "その日の動き", wish: "行きたいところから入れる", shiori: "旅のしおり", suggest: "予定の提案", consult: "AIに相談", phrases: "旅のフレーズ集", emergency: "緊急時の情報" })[sheet.kind];

  return (
    <GeoCtx.Provider value={(names, ll) => update(tr => ({ ...tr, geo: { ...(tr.geo || {}), ...Object.fromEntries(names.filter(Boolean).map(n => [n, ll])) } }))}>
    <SuggestCtx.Provider value={sugg}>
    <div className="app">
      <header className={"topbar" + (scrolled ? " scrolled" : "")}>
        <button className="tripbtn" onClick={() => setSheet({ kind: "trips" })} aria-label={`旅行を切り替える（今は${t.name}）`}><span>{t.name}</span><Icon n="down" s={16} /></button>
        <div className="spacer" />
        <button className="btn small ghost" onClick={() => setSheet({ kind: "settings", section: "share" })} style={{ position: "relative", gap: 6 }} aria-label="この旅行を共有する"><Icon n="share" s={16} />共有{typeof TrunkMenuBadge === "function" && <TrunkMenuBadge tripId={tripId} />}</button>
        <button className="iconbtn" aria-label="その他のメニュー" aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon n="dots" /></button>
      </header>
      <nav className="nav" aria-label="メインメニュー">
        {NAV.map(([k, l, ic]) => (
          <button key={k} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>
            <span className="navicon"><Icon n={ic} s={22} />{k === "book" && ((inbox.length + extInbox) || openCount) > 0 && <span className="badge">{(inbox.length + extInbox) || openCount}</span>}</span>{l}
          </button>
        ))}
      </nav>
      <main className="main">
        {tab === "home" && typeof TrunkPassBanner === "function" && <TrunkPassBanner onTrips={() => setSheet({ kind: "trips" })} />}
        {tab === "home" && typeof TrunkRequestsBanner === "function" && <TrunkRequestsBanner tripId={tripId} onOpen={() => setSheet({ kind: "settings", section: "share" })} />}
        {tab === "home" && typeof TrunkAfterTrip === "function" && <TrunkAfterTrip t={t} tripId={tripId} />}
        {tab === "home" && <HomeView onShare={() => { update(tr => ({ ...tr, startShared: true })); setSheet({ kind: "settings", section: "share" }); }} onHideGuide={() => update(tr => ({ ...tr, startGuideOff: true }))} t={t} stats={stats} mine={mine} openDay={openDay} openPhrases={() => setSheet({ kind: "phrases" })} openEmergency={() => setSheet({ kind: "emergency" })} openShiori={() => setSheet({ kind: "shiori" })} openSettings={() => setSheet({ kind: "shift" })} onExpense={() => { setMoneyMode("expense"); setTab("money"); }} onPlanAI={FEATURES.ai ? null : () => setSheet({ kind: "consult", topic: "plan" })} todos={todos} onTodo={onTodo} inboxCount={inbox.length} scan={scan} onScan={scanGmail} go={setTab} />}
        {tab === "plan" && <PlanView update={update} onWish={(d) => setSheet({ kind: "wish", iso: d })} t={t} view={planView} setView={setPlanView} onEdit={setSheet} onAdd={() => setSheet({ kind: "add" })} onAddStay={addStay} onAddLocal={(d, o) => addLocal(d, undefined, o)} onAddMove={(d, o) => addTransit(d, undefined, o)} onGuessGeo={guessGeo} guessing={guessing} onSuggest={FEATURES.ai ? (d) => setSheet({ kind: "suggest", iso: d }) : (d) => setSheet({ kind: "consult", topic: "day", iso: d })} />}
        {tab === "book" && <BookView t={t} filter={bookFilter} setFilter={setBookFilter} onEdit={setSheet} onAddLocal={() => setSheet({ kind: "add" })} mail={FEATURES.mail ? mail : FEATURES.mailImport && typeof TrunkMailCard === "function" ? <TrunkMailCard t={t} update={update} toast={toast} trips={trips} tripId={tripId} onPick={pickTrip} onCreate={createTrip} onEdit={setSheet} /> : null} entry={FEATURES.ai ? <EntryChecks t={t} update={update} /> : null} />}
        {tab === "money" && <MoneyView t={meName === t.myName ? t : { ...t, myName: meName }} stats={stats} update={update} mode={moneyMode} setMode={setMoneyMode} tripId={tripId} setMe={setMe} />}
        {tab === "pack" && <PackView t={packT} update={packUpdate} />}
      </main>
      {menu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setMenu(false)} />
          <div className="menu" role="menu">
            <div className="menuhead">旅のツール</div>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "shiori" }); }}>旅のしおり（PDFで保存）</button>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "phrases" }); }}>旅のフレーズ集</button>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "emergency" }); }}>緊急時の情報</button>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "consult" }); }}>AIに相談（ChatGPT・Claude など）</button>
            <hr />
            <div className="menuhead">この旅行</div>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "settings", section: "trip" }); }}>この旅行の設定（名前・コピー・削除）</button>
            <button role="menuitem" aria-expanded={menuData} onClick={() => setMenuData(!menuData)}>データの書き出し・読み込み<span style={{ marginLeft: "auto", transform: menuData ? "rotate(180deg)" : "none", display: "inline-flex" }}><Icon n="down" s={14} /></span></button>
            {menuData && <>
              <button role="menuitem" className="sub" onClick={exportICS}>カレンダー用に書き出す（.ics）</button>
              <button role="menuitem" className="sub" onClick={exportJSON}>データを書き出す（JSON）</button>
              <button role="menuitem" className="sub" onClick={() => { setMenu(false); fileRef.current && fileRef.current.click(); }}>データを読み込む（JSON）</button>
            </>}
            {hasAccountSheet() && <><hr /><button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "settings", section: "account" }); }}>アカウント（プラン・ご要望・ログアウト）</button></>}
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
      {sheet && (
        <Sheet title={sheetTitle} onClose={closeSheet} full={sheet.kind === "shiori"}>
          {sheet.kind === "shiori" && <ShioriView t={priv ? { ...packT, emergency: priv } : packT} canExport update={update} />}
          {sheet.kind === "emergency" && <EmergencyView t={emT} update={emUpdate} canEdit />}
          {sheet.kind === "consult" && <ConsultView t={t} update={update} initialTopic={sheet.topic} initialIso={sheet.iso} done={(m) => { toast(m); closeSheet(); }} />}
          {sheet.kind === "phrases" && <PhraseView t={t} update={update} onSave={((tid) => (p) => Store.setPhrase(tid, p))(tripId)} canGenerate={FEATURES.ai} onConsult={FEATURES.ai ? null : () => setSheet({ kind: "consult", topic: "phrase" })} />}
          {sheet.kind === "suggest" && <DaySuggest t={t} iso={sheet.iso} update={update} done={(n) => { toast(`${n}件の予定を追加しました`); closeSheet(); }} />}
          {sheet.kind === "wish" && <WishPicker t={t} iso={sheet.iso} update={update} done={(name) => { toast(`「${name}」を${md(sheet.iso)}に入れました`); closeSheet(); }} />}
          {sheet.kind === "day" && <DayDetail t={t} iso={sheet.iso} setIso={(iso) => setSheet({ kind: "day", iso })} onEdit={(e) => setSheet({ ...e, back: sheet.iso })} onAddLocal={(d, o) => addLocal(d, d, o)} onAddMove={(d, o) => addTransit(d, d, o)} onSuggest={FEATURES.ai ? (d) => setSheet({ kind: "suggest", iso: d, back: d }) : (d) => setSheet({ kind: "consult", topic: "day", iso: d, back: d })} />}
          {sheet.kind === "stay" && <StayEditor t={withPending(t)} id={sheet.id} update={pendUpdate} close={closeSheet} />}
          {sheet.fresh && (sheet.kind === "local" || sheet.kind === "transit") && (
            <div className="seg" role="tablist" aria-label="追加するもの" style={{ marginBottom: 12 }}>
              <button role="tab" aria-selected={sheet.kind === "local"} onClick={() => switchNew("local")}>予定</button>
              <button role="tab" aria-selected={sheet.kind === "transit"} onClick={() => switchNew("transit")}>移動</button>
              <button role="tab" aria-selected={false} onClick={() => switchNew("stay")}>宿泊</button>
            </div>
          )}
          {sheet.kind === "transit" && <TransitEditor t={withPending(t)} id={sheet.id} update={pendUpdate} close={closeSheet} />}
          {sheet.kind === "local" && <LocalEditor t={withPending(t)} id={sheet.id} update={pendUpdate} close={closeSheet} />}
          {["stay", "transit", "local"].includes(sheet.kind) && (
            <div className="row between" style={{ gap: 10, marginTop: 4 }}><span className="small muted">入力した内容は、その場で保存されます</span><button className="btn primary" onClick={closeSheet}>完了</button></div>
          )}
          {sheet.kind === "add" && (
            <div className="card flush divide">
              {[["bed", "滞在（都市・宿）", addStay], ["route", "移動（飛行機・電車・バス・タクシーなど）", () => addTransit()], ["ticket", "予定（観光・食事・ツアーなど）", () => addLocal()]].map(([ic, l, f]) => (
                <button key={l} className="bookrow" style={{ gridTemplateColumns: "36px minmax(0,1fr)" }} onClick={f}><span className="ico open" style={{ background: "var(--sunk)", color: "var(--ink)" }}><Icon n={ic} /></span><span className="t1">{l}</span></button>
              ))}
            </div>
          )}
          {sheet.kind === "trips" && <TripsSheet limited={atLimit} trips={trips} currentId={tripId} onPick={pickTrip} onCreate={createTrip} onSettings={() => setSheet({ kind: "settings" })} />}
          {sheet.kind === "shift" && <ShiftDates t={t} update={update} />}
          {sheet.kind === "settings" && <SettingsSheet t={t} tripId={tripId} update={update} onCopy={copyTrip} onDelete={deleteTrip} joined={!!(Store.isJoined && Store.isJoined(tripId))} section={sheet.section} canDelete={FEATURES.account || trips.length > 1} onRequest={importRequest} busy={scan.st === "busy"} />}
          {sheet.kind === "import" && (
            <>
              <p>「{sheet.data.name || "読み込んだ旅行"}」のデータ（滞在 {staysOf(sheet.data).length}件・移動 {transitsOf(sheet.data).length}件）を読み込みます。</p>
              <button className="btn primary block" onClick={() => { update(tr => upgradeTrip({ ...sheet.data, name: tr.name, gmailLabel: tr.gmailLabel, createdAt: tr.createdAt })); setSheet(null); toast(`「${t.name}」を上書きしました`); }}>今の旅行（{t.name}）を上書きする</button>
              <button className="btn block" disabled={atLimit} onClick={async () => { const id = FEATURES.newId ? FEATURES.newId() : "t-" + Date.now().toString(36); await Store.saveTrip(id, upgradeTrip({ ...sheet.data, name: sheet.data.name || "読み込んだ旅行" })); pickTrip(id); toast("新しい旅行として追加しました"); }}>新しい旅行として追加する</button>
            </>
          )}
        </Sheet>
      )}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
      {confirmBox && (
        <div className="noticebar" role="alertdialog" aria-label="保存の確認">
          <span>{confirmBox.msg}</span>
          <div className="row" style={{ gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="btn" onClick={() => {
              // 元に戻す：保存先にある内容に戻し、まだ保存していない変更も捨てる
              const id = confirmBox.id, prev = Store.cache.get(id);
              setConfirmBox(null); opsRef.current[id] = [];
              if (prev && idRef.current === id) { lastSaved.current[id] = JSON.stringify(prev); const d = upgradeTrip(prev); draftRef.current = d; setDraft(d); }
            }}>元に戻す</button>
            <button className="btn primary" onClick={() => { const c = confirmBox; setConfirmBox(null); save(c.id, c.data, true); }}>この内容で保存</button>
          </div>
        </div>
      )}
      {notice && <div className="noticebar" role="alert"><span>{notice}</span><button className="btn" onClick={() => setNotice("")}>閉じる</button></div>}
    </div>
    </SuggestCtx.Provider>
    </GeoCtx.Provider>
  );
}

