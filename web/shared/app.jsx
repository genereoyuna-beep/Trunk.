const { useState, useEffect, useMemo, useRef } = React;

// ================= アイコン =================
const ICONS = {
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
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  paste: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6" /></>,
  pencil: <><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></>,
  food: <><path d="M7 3v8a2 2 0 0 0 4 0V3M9 3v18M17 3c-1.7 0-3 2-3 5v5h3v8" /></>,
  ext: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
};
function Icon({ n, s = 18, w = 2 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[n]}</svg>;
}
const modeIcon = (m) => m === "飛行機" ? "plane" : (m === "鉄道" || m === "夜行列車" || m === "地下鉄") ? "train" : (m === "フェリー" || m === "夜行フェリー") ? "ship" : m === "バス" ? "bus" : (m === "車" || m === "タクシー") ? "car" : (m === "徒歩" || m === "その他") ? "route" : "question";
const Pill = ({ st }) => <span className={"pill tone-" + st.tone}><i />{st.label}</span>;
const NAV = [["home", "ホーム", "home"], ["plan", "旅程", "cal"], ["book", "予約・手配", "ticket"], ["money", "お金", "wallet"], ["pack", "持ち物", "bag"]];
const TABS = NAV.map(n => n[0]);

// ================= 入力の部品 =================
function Field({ label, wide, children }) {
  return <label className={"field" + (wide ? " wide" : "")}><span>{label}</span>{children}</label>;
}
function TextIn({ value, onChange, ...p }) { return <input type="text" value={value ?? ""} onChange={e => onChange(e.target.value)} {...p} />; }
const SuggestCtx = React.createContext({ cities: [], usedCarriers: [], sites: BOOKING_SITES, addresses: [], descs: [] });
let suggestSeq = 0;
function SuggestIn({ value, onChange, options, ...p }) {
  const id = useRef("sg-" + (++suggestSeq)).current;
  const opts = uniq(options || []).filter(o => o !== value).slice(0, 80);
  return <><input type="text" list={id} value={value ?? ""} onChange={e => onChange(e.target.value)} autoComplete="off" {...p} /><datalist id={id}>{opts.map(o => <option key={o} value={o} />)}</datalist></>;
}
function NumIn({ value, onChange, ...p }) { return <input type="number" inputMode="numeric" value={value === 0 || value ? value : ""} onWheel={e => e.target.blur()} onChange={e => onChange(e.target.value === "" ? 0 : Number(e.target.value))} {...p} />; }
function DateIn({ value, onChange }) { return <input type="date" value={value || ""} onChange={e => onChange(e.target.value)} />; }
function TimeIn({ value, onChange }) { return <input type="time" value={value || ""} onChange={e => onChange(e.target.value)} />; }
function Toggle({ checked, onChange, children }) {
  return <label className="toggle"><input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />{children}</label>;
}
// 状態：未予約／予約済み（＋キャンセル条件）／支払い済み
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
  const setStay = (patch) => update(tr => ({ ...tr, itinerary: normalizeItinerary(tr.itinerary.map(x => x.id === id ? { ...x, ...patch } : x)) }));
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
        <Field label="都市" wide><SuggestIn value={s.city} onChange={v => setStay({ city: v })} options={sg.cities} placeholder="例：プラハ" /></Field>
        <Field label="到着日（泊まり始め）"><DateIn value={s.startDate} onChange={v => setStay({ startDate: v })} /></Field>
        <Field label="泊数"><select value={nightsOf(s)} onChange={e => setStay({ nights: Number(e.target.value) })}>{Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{i === 0 ? "日帰り（0泊）" : `${i}泊`}</option>)}</select></Field>
        <Field label="メモ" wide><textarea value={s.memo || ""} onChange={e => setStay({ memo: e.target.value })} /></Field>
      </div>
      <Toggle checked={s.noHotel} onChange={v => setStay({ noHotel: v, lodgingLabel: v ? (s.lodgingLabel || "宿不要") : s.lodgingLabel })}>宿の手配はいらない（家族・友人宅など）</Toggle>
      {s.noHotel ? (
        <Field label="宿の代わりに表示する言葉"><TextIn value={s.lodgingLabel} onChange={v => setStay({ lodgingLabel: v })} placeholder="例：実家・友人宅" /></Field>
      ) : (
        <>
          <div className="formsec">宿</div>
          <BookingStatus status={h.status || "候補"} paid={h.paymentStatus} openLabel="未手配" onStatus={v => setHotel({ status: v })} onPaid={v => setHotel({ paymentStatus: v })} />
          <div className="fgrid">
            <Field label="宿泊先名" wide><TextIn value={h.name} onChange={v => setHotel({ name: v })} placeholder="候補の宿もここに" /></Field>
            <Field label="総額（円）"><NumIn value={h.total} onChange={v => setHotel({ total: v, perNight: Math.round(v / n) })} /></Field>
            <Field label="人数（総額は何人分か）"><select value={h.guests || guessGuests(t)} onChange={e => setHotel({ guests: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}人</option>)}</select></Field>
            <Field label="チェックイン"><select value={h.checkinTime || ""} onChange={e => setHotel({ checkinTime: e.target.value })}><option value="">未設定</option>{TIME_OPTIONS.map(x => <option key={x}>{x}</option>)}</select></Field>
            <Field label="チェックアウト"><select value={h.checkoutTime || ""} onChange={e => setHotel({ checkoutTime: e.target.value })}><option value="">未設定</option>{TIME_OPTIONS.map(x => <option key={x}>{x}</option>)}</select></Field>
            <Field label="予約サイト"><SuggestIn value={h.site} onChange={v => setHotel({ site: v })} options={sg.sites} placeholder="Airbnb など" /></Field>
            <Field label="予約番号"><TextIn value={h.confirmation} onChange={v => setHotel({ confirmation: v })} /></Field>
            <Field label="無料キャンセル期限"><DateIn value={h.cancelDeadline} onChange={v => setHotel({ cancelDeadline: v })} /></Field>
            <Field label="予約ページのURL"><TextIn value={h.url} onChange={v => setHotel({ url: v })} inputMode="url" /></Field>
            <Field label="住所" wide><TextIn value={h.address} onChange={v => setHotel({ address: v })} /></Field>
          </div>
          <div className="row">
            {h.url && <a className="btn small" href={h.url} target="_blank" rel="noopener noreferrer"><Icon n="ext" s={14} />予約ページ</a>}
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
        <Field label="出発地"><SuggestIn value={x.fromCity} onChange={v => set({ fromCity: v })} options={[...placeOpts, ...sg.addresses]} /></Field>
        <Field label="到着地"><SuggestIn value={x.toCity} onChange={v => set({ toCity: v })} options={[near[1], near[0], ...AIRPORTS, ...sg.cities, ...sg.addresses]} /></Field>
        <Field label="手段"><select value={x.mode || "未定"} onChange={e => set({ mode: e.target.value })}>{MODES.map(m => <option key={m}>{m}</option>)}</select></Field>
        <Field label="内容（任意）"><TextIn value={x.desc} onChange={v => set({ desc: v })} placeholder="例：空港リムジンバス" /></Field>
        {!short && <Field label="会社・便名"><SuggestIn value={x.airline} onChange={v => set({ airline: v })} options={[...(CARRIERS[mode] || Object.values(CARRIERS).flat()), ...sg.usedCarriers]} placeholder="例：Eurostar 9132" /></Field>}
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
        }) : <div className="field"><span>時差</span><button className="btn small" style={{ justifySelf: "start" }} onClick={() => setShowTZ(true)}>なし（{fmtTZ(effTZ(x, "depart"))}）・直す</button></div>}
        {!short && <Field label="クラス・席"><SuggestIn value={x.cls} onChange={v => set({ cls: v })} options={CLASSES[mode] || CLASSES["飛行機"]} /></Field>}
        {!short && <Field label="経由"><TextIn value={x.transitStops} onChange={v => set({ transitStops: v })} /></Field>}
        <Field label="金額（円）"><NumIn value={x.price} onChange={v => set({ price: v })} /></Field>
        <Field label="人数（金額は何人分か）"><select value={x.people || 1} onChange={e => set({ people: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}人</option>)}</select></Field>
        <div className="field"><span>所要時間</span><div className="mono" style={{ padding: "9px 0" }}>{dur || "—"}</div></div>
      </div>
      {FEATURES.ai && isLeg(x) && <><div className="formsec" /><TransitSuggest t={t} x={x} set={set} /></>}
      <div className="formsec">予約</div>
      <Toggle checked={needs || booked} onChange={v => set({ needsBooking: v })}>事前の予約が必要</Toggle>
      {(needs || booked) && <BookingStatus status={x.status} paid={x.paymentStatus} onStatus={v => set({ status: v })} onPaid={v => set({ paymentStatus: v })} />}
      <Field label="メモ"><textarea value={x.memo || ""} onChange={e => set({ memo: e.target.value })} /></Field>
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
        <Field label="終了"><TimeIn value={l.endTime} onChange={v => set({ endTime: v })} /></Field>
        {isMove ? (
          <>
            <Field label="出発地"><SuggestIn value={l.fromAddress} onChange={v => set({ fromAddress: v })} options={[...sg.addresses, ...AIRPORTS, ...sg.cities]} /></Field>
            <Field label="到着地"><SuggestIn value={l.toAddress} onChange={v => set({ toAddress: v })} options={[...sg.addresses, ...AIRPORTS, ...sg.cities]} /></Field>
            <Field label="乗り物"><SuggestIn value={l.mode} onChange={v => set({ mode: v })} options={["電車", "地下鉄", "バス", "タクシー", "Uber", "徒歩", "船", "レンタカー", "送迎"]} /></Field>
          </>
        ) : (
          <Field label="場所・住所" wide><SuggestIn value={l.address} onChange={v => set({ address: v })} options={[...sg.addresses, ...sg.cities]} /></Field>
        )}
        <Field label="金額（円）"><NumIn value={l.price} onChange={v => set({ price: v })} /></Field>
        <Field label="人数（金額は何人分か）"><select value={l.people || 1} onChange={e => set({ people: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}人</option>)}</select></Field>
      </div>
      <Toggle checked={l.needsBooking} onChange={v => set({ needsBooking: v })}>事前の予約が必要</Toggle>
      <BookingStatus status={l.status || "候補"} paid={l.paymentStatus} onStatus={v => set({ status: v })} onPaid={v => set({ paymentStatus: v })} />
      <Field label="メモ"><textarea value={l.memo || ""} onChange={e => set({ memo: e.target.value })} /></Field>
      <div className="formsec" />
      <DeleteButton label="この予定を削除" onDelete={remove} />
    </>
  );
}

// ================= ホーム =================
function HomeView({ t, stats, mine, todos, onTodo, inboxCount, scan, onScan, go, openDay, openPhrases, openEmergency, openShiori, openSettings }) {
  const r = tripRange(t), today = todayISO();
  const days = r ? dayDiff(today, r.start) : null;
  const sorted = sortItinerary(t.itinerary || []);
  const firstPlace = sorted.length ? splitCity(sorted[0].type === "transit" ? sorted[0].fromCity : sorted[0].city).main : "";
  const last = sorted[sorted.length - 1];
  const lastPlace = last ? splitCity(last.type === "transit" ? last.toCity : last.city).main : "";
  const dot = (iso) => iso ? iso.replace(/-/g, ".") : "—";
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
              <div className="route">
                <div><small>{firstPlace} 出発</small>{dot(r.start)}</div>
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none" stroke="#B9C2CC" strokeWidth="1.5" aria-hidden="true"><path d="M0 6h36M31 1l5 5-5 5" /></svg>
                <div style={{ textAlign: "right" }}><small>{lastPlace} 着</small>{dot(r.end)}</div>
              </div>
              <div className="small" style={{ marginTop: 12, color: "#B9C2CC" }}>{r.days}日間 ・ {stats.cities}都市</div>
            </>
          )}
        </section>
        {r && days <= 0 && dayDiff(today, r.end) >= 0 && (
          <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12 }} onClick={() => openDay(today)}>
            <span className="ico blue"><Icon n="clock" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t1">今日の予定</span><span className="t2">{md(today)}（{wdOf(today)}）の動きを時刻順に見る</span></span>
            <Icon n="down" s={16} />
          </button>
        )}
        {r && r.days <= 10 && (
          <section className="card flush divide">
            <div className="row" style={{ padding: "12px 14px", justifyContent: "space-between", alignItems: "center" }}><h3>日程</h3>{openSettings && <button className="btn small" onClick={openSettings}>日程を変える</button>}</div>
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
              <div className="legend"><span><b style={{ color: "var(--blue)" }}>{n.booked}</b> 予約済み</span><span><b style={{ color: "var(--orange)" }}>{n.open}</b> 未手配</span>{n.none > 0 && <span><b className="muted">{n.none}</b> 宿不要</span>}</div>
            </div>
            <div className="card">
              <div className="row between"><span className="small muted">移動</span><span className="mono small muted">{mv.total}区間</span></div>
              <div className="bar">{mv.booked > 0 && <span style={{ flex: mv.booked, background: "var(--blue)" }} />}{mv.decided > 0 && <span style={{ flex: mv.decided, background: "var(--orange-bar)" }} />}{mv.unknown > 0 && <span style={{ flex: mv.unknown, background: "repeating-linear-gradient(45deg,#E8892B 0 3px,#FDEBD3 3px 6px)" }} />}</div>
              <div className="legend"><span><b style={{ color: "var(--blue)" }}>{mv.booked}</b> 予約済み</span><span><b style={{ color: "var(--orange)" }}>{mv.decided}</b> 未予約</span><span><b style={{ color: "var(--orange)" }}>{mv.unknown}</b> 手段未定</span></div>
            </div>
          </div>
        )}
      </div>
      <div className="stack h-c">
        <section>
          <div className="sechead"><h2>お金</h2><span className="small muted">予算（1人分） <b className="mono" style={{ color: "var(--ink)" }}>{yen(t.totalBudget)}</b></span></div>
          <button className="card" style={{ width: "100%", textAlign: "left", border: 0 }} onClick={() => go("money")}>
            <div className="row between"><span className="small muted">今の見込み（{mine.mode === "split" ? `${t.myName}さんの負担分` : "1人分"}）</span><span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{yen(mine.total)}</span></div>
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
        </section>
      </div>
      <div className="stack h-b">
        <section>
          <div className="sechead"><h2>今やること</h2></div>
          <div className="card flush divide">
            {todos.length === 0 && <p className="empty">今やることはありません。</p>}
            {todos.map((td, i) => (
              <button key={i} className="todo" onClick={() => onTodo(td)}>
                <span className={"ico " + (td.urgent ? "urgent" : td.icon === "mail" ? "blue" : "open")}><Icon n={td.icon} /></span>
                <span style={{ minWidth: 0 }}><span className="t1">{td.title}</span><span className="t2">{td.sub}</span></span>
                <span className={"pill " + (td.urgent ? "tone-open" : "tone-none")}>{td.tag}</span>
              </button>
            ))}
          </div>
        </section>
        {r && ((days > 0 && days <= 14) || (days <= 0 && dayDiff(today, r.end) >= 0)) && (
          <button className="card row" style={{ width: "100%", textAlign: "left", border: 0, flexWrap: "nowrap", gap: 12, boxShadow: "0 0 0 1.5px var(--blue)" }} onClick={openShiori}>
            <span className="ico blue"><Icon n="ext" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="t1">オフライン用にしおりを保存</span><span className="t2" style={{ whiteSpace: "normal" }}>電波がない所でも見られるよう、PDFをスマホに保存しておきましょう</span></span>
          </button>
        )}
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
function DayView({ t, onEdit, onAddLocal, onAddMove, onSuggest }) {
  const r = tripRange(t);
  const [sel, setSel] = useState(() => firstDay(r));
  useEffect(() => { if (r && (!sel || sel < r.start || sel > r.end)) setSel(firstDay(r)); }, [r && r.start, r && r.end]);
  if (!r) return <p className="empty card">日付の入った予定がまだありません。右上の「追加」から滞在を入れてください。</p>;
  const today = todayISO();
  const days = [];
  for (let d = r.start; d <= r.end; d = addDays(d, 1)) days.push(d);
  const cur = sel && sel >= r.start && sel <= r.end ? sel : days[0];
  return (
    <div className="stack">
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
                {onSuggest && <button className="btn small" onClick={() => onSuggest(d)}>提案</button>}
                <button className="btn small" onClick={() => onAddLocal(d)}><Icon n="plus" s={14} />予定</button>
                {onAddMove && <button className="btn small" onClick={() => onAddMove(d)}><Icon n="plus" s={14} />移動</button>}
              </span>
            </div>
            <DayTimeline t={t} iso={d} onEdit={onEdit} />
          </section>
        );
      })())}
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
            {onGuess && <button className="btn small" disabled={guessing} onClick={onGuess}>{guessing ? "推測中…" : "Claudeで位置を推測"}</button>}
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
function PlanView({ t, view, setView, onEdit, onAdd, onAddLocal, onAddMove, onGuessGeo, guessing, onSuggest }) {
  const [onlyOpen, setOnlyOpen] = useState(false);
  const openCount = (t.itinerary || []).filter(r => isOpenState(r.type === "transit" ? transitState(r) : stayState(t, r))).length;
  return (
    <div className="stack">
      <div className="row between" style={{ marginTop: 4 }}><h1>旅程</h1><button className="btn primary" onClick={onAdd}><Icon n="plus" s={16} />追加</button></div>
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
      {view === "day" && <DayView t={t} onEdit={onEdit} onAddLocal={onAddLocal} onAddMove={onAddMove} onSuggest={onSuggest} />}
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
  if (ending && !ending.noHotel) { const h = hotelOf(t, ending) || {}; ev.push({ k: h.checkoutTime || "10:00", co: !h.checkoutTime, time: h.checkoutTime, icon: "bed", title: "チェックアウト", sub: h.name || `${splitCity(ending.city).main}の宿`, edit: { kind: "stay", id: ending.id } }); }
  transitsOf(t).forEach(x => {
    const from = splitCity(x.fromCity).main, to = splitCity(x.toCity).main, dur = calcDuration(x), st = transitState(x);
    if (!isLeg(x)) {
      // 街の中の移動は1行で（出発〜到着）
      if (x.departDate === iso) ev.push({ k: x.departTime || "13:00", time: x.departTime ? x.departTime + (x.arriveTime ? `〜${x.arriveTime}` : "") : "", icon: modeIcon(x.mode), title: moveTitle(x), sub: [x.mode !== "未定" && x.mode, from && to && x.desc, x.airline, dur].filter(Boolean).join(" ・ "), st, edit: { kind: "transit", id: x.id } });
      return;
    }
    if (x.departDate === iso) {
      const arr = x.arriveTime ? (x.arriveDate && x.arriveDate !== iso ? `${md(x.arriveDate)} ${x.arriveTime} 着` : `${x.arriveTime} 着`) : "";
      ev.push({ k: x.departTime || "12:00", dep: true, time: x.departTime, icon: modeIcon(x.mode), title: `${from} 発 → ${to}`, sub: [x.mode, x.airline, arr, dur, x.cls].filter(Boolean).join(" ・ "), st, edit: { kind: "transit", id: x.id } });
      if (x.arriveDate === iso && x.arriveTime) ev.push({ k: x.arriveTime, arr: true, time: x.arriveTime, icon: "pin", title: `${to} 着`, sub: x.airline || x.mode, edit: { kind: "transit", id: x.id } });
    } else if (x.arriveDate === iso && x.departDate && x.departDate < iso) {
      ev.push({ k: x.arriveTime || "08:00", arr: true, time: x.arriveTime, icon: "pin", title: `${to} 着`, sub: `${md(x.departDate)} ${from}発 ・ ${x.airline || x.mode}`, edit: { kind: "transit", id: x.id } });
    }
  });
  (t.localTransport || []).filter(l => l.date === iso).forEach(l => ev.push({
    k: l.startTime || "13:00", time: l.startTime ? l.startTime + (l.endTime ? `〜${l.endTime}` : "") : "", icon: l.category === "移動" ? "route" : l.category === "食事" ? "food" : l.category === "観光" ? "pin" : l.category === "買い物" ? "bag" : "ticket", title: l.desc || l.category,
    sub: [l.category, l.category === "移動" ? [l.fromAddress, l.toAddress].filter(Boolean).join(" → ") : l.address].filter(Boolean).join(" ・ "), st: localState(l), edit: { kind: "local", id: l.id },
    map: l.category !== "移動" && l.address ? l.address : "",
  }));
  if (starting) {
    const h = hotelOf(t, starting) || {};
    ev.push(starting.noHotel
      ? { k: h.checkinTime || "18:00", icon: "home", title: `${starting.lodgingLabel || "宿不要"}へ`, sub: splitCity(starting.city).main, edit: { kind: "stay", id: starting.id } }
      : { k: h.checkinTime || "15:00", ci: !h.checkinTime, time: h.checkinTime, icon: "bed", title: "チェックイン", sub: h.name || "宿未定", st: stayState(t, starting), edit: { kind: "stay", id: starting.id }, map: h.address || "" });
  }
  // 時刻のないチェックアウトはその日の最初の出発より前、チェックインは最後の到着より後に置く
  const deps = ev.filter(e => e.dep).map(e => e.k).sort(), arrs = ev.filter(e => e.arr).map(e => e.k).sort();
  ev.forEach(e => { if (e.co && deps.length && deps[0] < e.k) e.k = deps[0]; if (e.ci && arrs.length && arrs[arrs.length - 1] >= e.k) e.k = arrs[arrs.length - 1] + "~"; });
  ev.sort((a, b) => a.k.localeCompare(b.k));
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
function DayTimeline({ t, iso, onEdit, showNight = true }) {
  const { ev, sleeping, night } = dayEvents(t, iso);
  return (
    <>
      {ev.length === 0 && <p className="empty" style={{ padding: "10px 14px" }}>この日の予定はまだありません。</p>}
      {ev.map((e, i) => (
        <div key={i} className="bookrow" style={{ gridTemplateColumns: "56px minmax(0,1fr) auto", cursor: "default", minHeight: 52, padding: "8px 14px" }}>
          <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: e.time ? "var(--ink)" : "var(--faint)" }}>{e.time ? e.time.slice(0, 5) : "—"}</span>
          <button style={{ border: 0, background: "none", textAlign: "left", padding: 0, minWidth: 0 }} onClick={() => onEdit(e.edit)}>
            <span className="t1"><span style={{ verticalAlign: "-3px", marginRight: 6, display: "inline-flex" }}><Icon n={e.icon} s={16} /></span>{e.title}</span>
            {e.sub && <span className="t2" style={{ whiteSpace: "normal" }}>{e.sub}</span>}
            {e.st && isOpenState(e.st) && <span className="pill tone-open" style={{ marginTop: 4 }}><i />{e.st.label}</span>}
          </button>
          {e.map ? <a className="iconbtn" aria-label="地図で開く" href={`https://www.google.com/maps?q=${encodeURIComponent(e.map)}`} target="_blank" rel="noopener noreferrer"><Icon n="pin" /></a> : <span />}
        </div>
      ))}
      {showNight && sleeping && (
        <div className="row between" style={{ padding: "10px 14px", flexWrap: "nowrap", background: "#FAFAF8" }}>
          <span style={{ minWidth: 0 }}><span className="xs muted">この夜の宿</span><span className="t1" style={{ fontSize: 13 }}>{night.name || "宿未定"}</span>
            {night.address && <a className="xs" href={`https://www.google.com/maps?q=${encodeURIComponent(night.address)}`} target="_blank" rel="noopener noreferrer">{night.address}</a>}
            {night.confirmation && <span className="xs muted" style={{ display: "block" }}>予約番号 <span className="mono">{night.confirmation}</span></span>}</span>
          <Pill st={stayState(t, sleeping)} />
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
      <div className="card flush divide"><DayTimeline t={t} iso={iso} onEdit={onEdit} /></div>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <button className="btn block" style={{ flex: 1 }} onClick={() => onAddLocal(iso)}><Icon n="plus" s={16} />予定を追加</button>
        {onAddMove && <button className="btn block" style={{ flex: 1 }} onClick={() => onAddMove(iso)}><Icon n="plus" s={16} />移動を追加</button>}
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
function InboxItem({ item, t, onApply, onDecide }) {
  const e = item.extracted || {};
  const foreign = e.total_amount > 0 && e.currency && e.currency !== "JPY";
  const [yenIn, setYenIn] = useState("");
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
      <div className="xs muted">{item.from}{item.receivedAt ? ` ・ ${new Date(item.receivedAt).toLocaleDateString("ja-JP")}` : ""}{item.url && <> ・ <a href={item.url} target="_blank" rel="noopener noreferrer">メールを開く</a></>}</div>
      <div style={{ fontWeight: 500 }}>→ {p.target}</div>
      {p.dateCheck && <div className="small" style={{ color: p.dateCheck.ok ? "var(--blue)" : "var(--danger)" }}>{p.dateCheck.ok ? "✓ " : "⚠ "}{p.dateCheck.text}</div>}
      {foreign && !cancelled && (
        <label className="field" htmlFor={"yen-" + item.gmailId}><span>金額 {e.currency} {Number(e.total_amount).toLocaleString()} を円にすると（空なら金額は変えません）</span>
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
  staysOf(t).forEach(s => { if (s.noHotel) return; const h = hotelOf(t, s); items.push({ type: "stay", date: s.startDate, icon: "bed", title: stayTitle(s, "宿"), sub: `${md(s.startDate)}〜${md(stayEnd(s))} ・ ${nightsOf(s)}泊${h && h.name ? " ・ " + h.name : ""}`, st: stayState(t, s), price: h ? h.total : 0, people: h ? peopleOf(h) : 1, edit: { kind: "stay", id: s.id } }); });
  transitsOf(t).forEach(x => items.push({ type: "transit", date: x.departDate, icon: modeIcon(x.mode), title: moveTitle(x), sub: `${md(x.departDate)}${x.departTime ? " " + x.departTime : ""} ・ ${x.mode || "未定"}${x.airline ? " ・ " + x.airline : ""}`, st: transitState(x), price: x.price, people: peopleOf(x), edit: { kind: "transit", id: x.id } }));
  (t.localTransport || []).forEach(l => items.push({ type: "local", date: l.date, icon: "ticket", title: l.desc || l.category, sub: `${md(l.date)}${l.startTime ? " " + l.startTime : ""} ・ ${l.category}`, st: localState(l), price: l.price, people: peopleOf(l), edit: { kind: "local", id: l.id } }));
  items.sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  const byState = (k) => items.filter(i => k === "all" ? true : k === "open" ? i.st.tone === "open" : i.st.tone === k);
  const shown = byState(filter.state).filter(i => filter.type === "all" || i.type === filter.type);
  return (
    <div className="stack">
      <div className="row between" style={{ marginTop: 4 }}><h1>予約・手配</h1><button className="btn" onClick={onAddLocal}><Icon n="plus" s={16} />予定</button></div>
      {entry}
      {mail}
      <div className="chips">
        {[["open", "未手配"], ["booked", "予約済み"], ["paid", "支払い済み"], ["all", "すべて"]].map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={filter.state === k} onClick={() => setFilter({ ...filter, state: k })}>{l} <b>{byState(k).length}</b></button>
        ))}
      </div>
      <div className="seg" role="tablist" aria-label="種類">
        {[["all", "すべて"], ["stay", "宿"], ["transit", "移動"], ["local", "予定"]].map(([k, l]) => <button key={k} role="tab" aria-selected={filter.type === k} onClick={() => setFilter({ ...filter, type: k })}>{l}</button>)}
      </div>
      <div className="card flush divide">
        {shown.length === 0 && <p className="empty">該当するものはありません。</p>}
        {shown.map((i, n) => (
          <button key={n} className="bookrow" onClick={() => onEdit(i.edit)}>
            <span className={"ico " + (i.st.tone === "open" ? "open" : i.st.tone === "none" ? "" : "blue")} style={i.st.tone === "none" ? { background: "var(--sunk)" } : i.st.tone === "paid" ? { background: "var(--ink)", color: "#fff" } : undefined}><Icon n={i.icon} /></span>
            <span style={{ minWidth: 0 }}><span className="t1">{i.title}</span><span className="t2">{i.sub}</span></span>
            <span style={{ textAlign: "right" }}><Pill st={i.st} />{Number(i.price) > 0 && <div className="mono small muted" style={{ marginTop: 4 }}>{yen(i.price)}{i.people > 1 && <span className="xs">（{i.people}人分）</span>}</div>}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ================= お金 =================
function MoneyView({ t, stats, update }) {
  const [mode, setMode] = useState("budget");
  const [allView, setAllView] = useState(false);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(null);
  const [payer, setPayer] = useState("");
  const pb = useMemo(() => personBreakdown(t), [t]);
  const participants = t.participants || [];
  const my = useMemo(() => myShare(t), [t]);
  const mine = allView ? null : my;
  const rows = (t.budget || []).map(b => ({ ...b, actualV: budgetActual(b, stats, mine) }));
  const totalT = rows.reduce((a, r) => a + (Number(r.target) || 0), 0), totalA = rows.reduce((a, r) => a + r.actualV, 0);
  const setB = (id, patch) => update(tr => ({ ...tr, budget: tr.budget.map(b => b.id === id ? { ...b, ...patch } : b) }));
  const costs = Object.fromEntries(participants.map(p => [p, (pb[p] && pb[p].total) || 0]));
  const effPayer = payer && participants.includes(payer) ? payer : participants.reduce((a, b) => (costs[a] || 0) >= (costs[b] || 0) ? a : b, participants[0]);
  const addMember = () => { const n = newName.trim(); if (!n || participants.includes(n)) return; update(tr => ({ ...tr, participants: [...(tr.participants || []), n] })); setNewName(""); };
  const stays = sortItinerary(staysOf(t)).filter(s => isISO(s.startDate));
  const daysOf = (s) => Array.from({ length: Math.max(1, nightsOf(s)) }, (_, i) => addDays(s.startDate, i));
  const membersOn = (iso) => { const m = (t.dayParticipants || {})[iso]; return m && m.length ? m : participants; };
  const togglePresence = (s, p) => update(tr => {
    const dp = { ...(tr.dayParticipants || {}) };
    const all = daysOf(s).every(d => membersOn(d).includes(p));
    daysOf(s).forEach(d => { const cur = membersOn(d); dp[d] = all ? cur.filter(x => x !== p) : [...new Set([...cur, p])]; });
    return { ...tr, dayParticipants: dp };
  });
  return (
    <div className="stack">
      <h1 style={{ marginTop: 4 }}>お金</h1>
      <div className="seg" role="tablist"><button role="tab" aria-selected={mode === "budget"} onClick={() => setMode("budget")}>予算</button><button role="tab" aria-selected={mode === "expense"} onClick={() => setMode("expense")}>支出</button><button role="tab" aria-selected={mode === "split"} onClick={() => setMode("split")}>精算</button></div>
      {mode === "expense" && <ExpenseView t={t} update={update} />}
      {mode === "budget" && <>
        <section className="card stack" style={{ gap: 8 }}>
          <div className="fgrid">
            <Field label="予算（1人分・円）"><NumIn value={t.totalBudget} onChange={v => update(tr => ({ ...tr, totalBudget: v }))} /></Field>
            <div className="field"><span>{!mine ? "全員分の合計" : mine.mode === "split" ? `${t.myName}さんの負担分` : "1人分の見込み"}</span><div className="mono" style={{ fontSize: 22, fontWeight: 600, padding: "4px 0" }}>{yen(totalA)}</div></div>
          </div>
          <div className="bar" style={{ height: 10 }}><span style={{ width: `${Math.min(100, t.totalBudget ? totalA / t.totalBudget * 100 : 0)}%`, background: t.totalBudget && totalA > t.totalBudget ? "var(--danger)" : "var(--ink)" }} /></div>
          <Toggle checked={allView} onChange={setAllView}>全員分の合計で見る</Toggle>
          <div className="note">{my.mode === "split" ? `「精算」の参加者と日ごとの参加状況から、${t.myName}さんの負担分を計算しています。` : "宿・移動・現地の金額を、それぞれの「人数（何人分の金額か）」で割って1人分を出しています。人数は各予定の編集画面で変えられます。"}</div>
        </section>
        <section className="card budget2">
          {rows.map(r => { const tg = Number(r.target) || 0, diff = tg - r.actualV; return (
            <div key={r.id} className="brow2">
              <div className="brow2-h">
                <input className="input" aria-label="項目名" value={r.category} onChange={e => setB(r.id, { category: e.target.value })} />
                <button className="iconbtn" aria-label={`${r.category}を削除`} onClick={() => update(tr => ({ ...tr, budget: tr.budget.filter(b => b.id !== r.id) }))}><Icon n="x" s={16} /></button>
              </div>
              <div className="brow2-g">
                <label><span>予算</span><NumIn value={r.target} onChange={v => setB(r.id, { target: v })} className="input" aria-label={`${r.category}の予算`} /></label>
                <label><span>{r.auto ? "見込み（自動）" : "実費"}</span>{r.auto ? <b className="mono">{yen(r.actualV)}</b> : <NumIn value={r.actual} onChange={v => setB(r.id, { actual: v })} className="input" aria-label={`${r.category}の実費`} />}</label>
                <div><span>差額</span><b className={"mono" + (tg && diff < 0 ? " over" : "")}>{tg ? (diff < 0 ? `${yen(-diff)} 超過` : `残り ${yen(diff)}`) : "—"}</b></div>
              </div>
            </div>); })}
          <div className="brow2 total"><div className="brow2-g">
            <div><span>予算の合計</span><b className="mono">{yen(totalT)}</b></div>
            <div><span>見込みの合計</span><b className="mono">{yen(totalA)}</b></div>
            <div><span>差額</span><b className={"mono" + (totalT && totalT - totalA < 0 ? " over" : "")}>{totalT ? (totalT - totalA < 0 ? `${yen(totalA - totalT)} 超過` : `残り ${yen(totalT - totalA)}`) : "—"}</b></div>
          </div></div>
          <button className="btn small" style={{ marginTop: 10 }} onClick={() => update(tr => ({ ...tr, budget: [...(tr.budget || []), { id: uid(), category: "", target: 0, auto: false, actual: 0 }] }))}><Icon n="plus" s={14} />項目を追加</button>
        </section>
      </>}
      {mode === "split" && <>
        <ExpenseSettle t={t} />
        <section className="card stack" style={{ gap: 10 }}>
          <h3>参加者</h3>
          <div className="chips">
            {participants.map(p => (
              <span key={p} className={"member" + (t.myName === p ? " me" : "")}>
                {p}
                <button aria-label={t.myName === p ? "自分の設定を外す" : `${p}を自分にする`} title="自分にする" onClick={() => update(tr => ({ ...tr, myName: tr.myName === p ? "" : p }))}><Icon n="star" s={14} /></button>
                <button aria-label={`${p}を外す`} onClick={() => update(tr => ({ ...tr, participants: tr.participants.filter(x => x !== p), myName: tr.myName === p ? "" : tr.myName }))}><Icon n="x" s={14} /></button>
              </span>
            ))}
            {!participants.length && <span className="small muted">まだ参加者がいません</span>}
          </div>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input className="input" aria-label="参加者の名前" placeholder="名前を追加" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMember()} />
            <button className="btn" onClick={addMember}>追加</button>
          </div>
          <div className="xs muted">★を押した人が「自分」です。予算画面で自分の負担分を見られます。</div>
        </section>
        {participants.length > 1 && stays.length > 0 && (
          <section className="card flush divide">
            <div style={{ padding: "12px 14px" }}><h3>滞在ごとの参加者</h3><div className="xs muted">いない人を外すと、その日の宿代・移動費を残りの人で割ります</div></div>
            {stays.map(s => (
              <div key={s.id} style={{ padding: "10px 14px" }} className="row between">
                <span style={{ minWidth: 0 }}><b>{splitCity(s.city).main}</b> <span className="mono xs muted">{md(s.startDate)}〜{md(stayEnd(s))}</span></span>
                <span className="chips">{participants.map(p => { const on = daysOf(s).every(d => membersOn(d).includes(p)); return <button key={p} className="chip" aria-pressed={on} onClick={() => togglePresence(s, p)}>{p}</button>; })}</span>
              </div>
            ))}
          </section>
        )}
        {participants.length > 0 && (
          <section className="card flush divide">
            <div style={{ padding: "12px 14px" }}><h3>人ごとの負担</h3></div>
            {participants.map(p => (
              <div key={p}>
                <button className="bookrow" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }} aria-expanded={open === p} onClick={() => setOpen(open === p ? null : p)}>
                  <span className="t1">{p}{t.myName === p ? "（自分）" : ""}</span><span className="mono">{yen(costs[p])}</span>
                </button>
                {open === p && <div style={{ padding: "0 14px 12px" }}>
                  {(pb[p].items || []).map((it, i) => <div key={i} className="row between small" style={{ flexWrap: "nowrap", padding: "3px 0" }}><span className="muted" style={{ minWidth: 0 }}>[{it.category}] {it.label}</span><span className="mono">{yen(it.amount)}</span></div>)}
                  {!pb[p].items.length && <div className="small muted">明細はありません</div>}
                </div>}
              </div>
            ))}
          </section>
        )}
        {participants.length > 1 && (
          <section className="card stack" style={{ gap: 8 }}>
            <div className="row between"><h3>精算</h3>
              <label className="row small muted" htmlFor="payer">立て替えた人<select id="payer" className="input" style={{ width: "auto" }} value={effPayer || ""} onChange={e => setPayer(e.target.value)}>{participants.map(p => <option key={p}>{p}</option>)}</select></label>
            </div>
            {participants.filter(p => p !== effPayer && costs[p] > 0).map(p => (
              <div key={p} className="row between" style={{ background: "var(--sunk)", borderRadius: 10, padding: "8px 12px" }}><span>{p} → {effPayer}</span><b className="mono">{yen(costs[p])}</b></div>
            ))}
          </section>
        )}
      </>}
    </div>
  );
}

// ================= 持ち物 =================
function PackView({ t, update }) {
  const [bag, setBag] = useState("すべて");
  const [adding, setAdding] = useState({});
  const [newCat, setNewCat] = useState("");
  const [bagEdit, setBagEdit] = useState(null); // null / { mode: "add" | "rename", name, from }
  const packing = t.packing || {};
  const all = Object.values(packing).flat();
  const done = all.filter(i => i.checked).length;
  const bags = Array.isArray(t.bags) ? t.bags : [];
  const sel = bags.includes(bag) || bag === "未定" ? bag : "すべて";
  const setItems = (cat, fn) => update(tr => ({ ...tr, packing: { ...tr.packing, [cat]: fn(tr.packing[cat] || []) } }));
  const mapAll = (tr, fn) => Object.fromEntries(Object.entries(tr.packing || {}).map(([c, xs]) => [c, xs.map(fn)]));
  const addItem = (cat) => { const n = (adding[cat] || "").trim(); if (!n) return; setItems(cat, items => [...items, { id: uid(), name: n, checked: false, bag: bags.includes(sel) ? sel : "" }]); setAdding({ ...adding, [cat]: "" }); };
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
            {shown.map(i => (
              <div key={i.id} className={"packitem" + (i.checked ? " done" : "")}>
                <input type="checkbox" aria-label={i.name} checked={!!i.checked} onChange={e => setItems(cat, xs => xs.map(x => x.id === i.id ? { ...x, checked: e.target.checked } : x))} />
                <span className="nm" style={{ minWidth: 0 }}>{i.name}</span>
                {bags.length > 0 ? <select className="input" aria-label="入れるかばん" style={{ width: "auto", fontSize: 12, padding: "4px 6px" }} value={bags.includes(i.bag) ? i.bag : ""} onChange={e => setItems(cat, xs => xs.map(x => x.id === i.id ? { ...x, bag: e.target.value } : x))}><option value="">未定</option>{bags.map(b => <option key={b}>{b}</option>)}</select> : <span />}
                <button className="iconbtn" aria-label={`${i.name}を削除`} onClick={() => setItems(cat, xs => xs.filter(x => x.id !== i.id))}><Icon n="x" s={16} /></button>
              </div>
            ))}
            <div className="row" style={{ padding: "8px 12px", flexWrap: "nowrap" }}>
              <input className="input" aria-label={`${cat}に追加`} placeholder="追加する" value={adding[cat] || ""} onChange={e => setAdding({ ...adding, [cat]: e.target.value })} onKeyDown={e => e.key === "Enter" && addItem(cat)} />
              <button className="btn small" onClick={() => addItem(cat)}>追加</button>
            </div>
          </section>
        );
      })}
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
function TripsSheet({ trips, currentId, onPick, onCreate, onSettings, limited }) {
  const [form, setForm] = useState(null);
  const [busyCreate, setBusyCreate] = useState(false);
  const sorted = [...trips].sort((a, b) => { const ra = tripRange(a.data), rb = tripRange(b.data); return (ra ? ra.start : "9") < (rb ? rb.start : "9") ? -1 : 1; });
  return (
    <>
      <div className="card flush divide">
        {sorted.map(x => { const r = tripRange(x.data); return (
          <button key={x.id} className="triprow" aria-current={x.id === currentId} onClick={() => onPick(x.id)}>
            <span style={{ minWidth: 0 }}><span className="t1" style={{ fontFamily: "var(--f-display)", fontWeight: 700 }}>{x.data.name}</span><span className="t2 mono">{r ? `${r.start.replace(/-/g, ".")} 〜 ${md(r.end)} ・ ${r.days}日間` : "日程未定"}</span></span>
            <span className="row" style={{ gap: 6, flex: "none" }}>{x.joined && <span className="pill tone-none">参加</span>}{x.pass && <span className="pill tone-booked">パス</span>}<span className="pill tone-none">{tripStatusText(x.data)}</span></span>
          </button>); })}
      </div>
      {typeof TrunkPlanLine === "function" && <TrunkPlanLine />}
      {limited && !form && <div className="note">{FREE_LIMIT_MSG}</div>}
      {limited && !form && typeof TrunkBuyPass === "function" && <TrunkBuyPass />}
      {!form && <div className="row"><button className="btn primary" disabled={limited} onClick={() => setForm({ name: "", start: "", nights: 2, label: "", home: FEATURES.homeAirport || "", idea: "" })}><Icon n="plus" s={16} />新しい旅行</button>{onSettings && <button className="btn" onClick={onSettings}>この旅行の設定</button>}</div>}
      {form && (
        <section className="card stack" style={{ gap: 10 }}>
          <h3>新しい旅行</h3>
          <div className="fgrid">
            <Field label="旅行の名前" wide><TextIn value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="例：台湾 2027 春" /></Field>
            <Field label="出発日（あとで変えられます）"><DateIn value={form.start} onChange={v => setForm({ ...form, start: v })} /></Field>
            <Field label="泊数"><select value={form.nights} onChange={e => setForm({ ...form, nights: Number(e.target.value) })}>{Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{i === 0 ? "日帰り" : `${i}泊`}</option>)}</select></Field>
            {FEATURES.mail && <Field label="Gmailのラベル（任意）"><TextIn value={form.label} onChange={v => setForm({ ...form, label: v })} placeholder="例：2027 TAIWAN" /></Field>}
            <Field label="出発地"><TextIn value={form.home} onChange={v => setForm({ ...form, home: v })} /></Field>
            {FEATURES.ai && <Field label="どんな旅行？（書くとClaudeが日程の下書きを作ります・任意）" wide><textarea value={form.idea} onChange={e => setForm({ ...form, idea: e.target.value })} placeholder="例：台北。夜市と温泉が好き。九份にも行きたい。のんびりめ" /></Field>}
          </div>
          {form.idea.trim() && !form.start && <div className="xs" style={{ color: "var(--orange)" }}>下書きを作るには出発日を入れてください</div>}
          <div className="row"><button className="btn primary" disabled={!form.name.trim() || busyCreate} onClick={async () => { setBusyCreate(true); await onCreate(form); setBusyCreate(false); }}>{busyCreate ? "下書きを作っています…" : form.idea.trim() && form.start ? "下書きを作って作成" : "作成する"}</button><button className="btn ghost" onClick={() => setForm(null)}>やめる</button></div>
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
            <a className="btn small" href={t.shareUrl} target="_blank" rel="noopener noreferrer"><Icon n="ext" s={14} /></a>
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
// 「共有と設定」：旅行／共有／プラン／その他 の段に分ける（プラン・その他は Trunk. だけ）
function SettingsSheet({ t, tripId, update, onCopy, onDelete, canDelete, onRequest, busy, joined, section }) {
  const hasPlan = typeof TrunkPlanSection === "function";
  const hasMore = typeof TrunkFeedbackSection === "function" || FEATURES.account;
  const tabs = [["trip", "旅行"], ["share", "共有"], ...(hasPlan ? [["plan", "プラン"]] : []), ...(hasMore ? [["more", "その他"]] : [])];
  const [tab, setTab] = useState(tabs.some(x => x[0] === section) ? section : "trip");
  return (
    <>
      <div className="seg" role="tablist" aria-label="設定の種類">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
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
      {tab === "plan" && hasPlan && <TrunkPlanSection />}
      {tab === "more" && <>
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
  const [planView, setPlanView] = useState("list");
  const [bookFilter, setBookFilter] = useState({ state: "open", type: "all" });
  const [sheet, setSheet] = useState(null);
  const [menu, setMenu] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [notice, setNotice] = useState("");
  const [inboxAll, setInboxAll] = useState([]);
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
    const batch = opsRef.current[id] || [];
    const json = JSON.stringify(data);
    lastSaved.current[id] = json;
    return Store.saveTrip(id, JSON.parse(json), batch).then(saved => {
      opsRef.current[id] = (opsRef.current[id] || []).slice(batch.length);
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
    let data = { ...emptyTrip(form.name.trim(), form.start || "", form.nights), gmailLabel: form.label.trim() };
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
    rememberTrip(id); idRef.current = null; setTripId(id); setSheet(null); setTab("plan"); toast(drafted ? "日程の下書きを入れて旅行を作りました" : form.idea && form.idea.trim() ? "旅行を作りました（下書きは作れませんでした）" : "旅行を作りました");
  };
  const copyTrip = async () => {
    flushNow();
    const src = draftRef.current; if (!src) return;
    const data = copyTripData(src);
    if (atLimit && isActiveTrip(data)) { setNotice(FREE_LIMIT_MSG); return; }
    const id = FEATURES.newId ? FEATURES.newId() : "t-" + Date.now().toString(36);
    try { await Store.saveTrip(id, data); }
    catch (e) { setNotice(e && e.code === "trip_limit" ? FREE_LIMIT_MSG : "コピーできませんでした。もう一度お試しください"); return; }
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
    update(tr => ({ ...tr, itinerary: normalizeItinerary([...tr.itinerary, s]) })); setSheet({ kind: "stay", id: s.id });
  };
  const addTransit = (date, back) => {
    const t = draftRef.current, stays = sortItinerary(staysOf(t)).filter(s => isISO(s.startDate)), last = stays[stays.length - 1];
    const onDay = isISO(date), d = onDay ? date : last ? stayEnd(last) : todayISO();
    const here = onDay ? stays.find(s => d >= s.startDate && d < stayEnd(s)) : null;
    const x = { id: uid(), type: "transit", mode: onDay ? "未定" : "飛行機", desc: "", fromCity: onDay ? (here ? here.city : "") : last ? last.city : "", toCity: "", departDate: d, departTime: "", departTZ: 9, arriveDate: d, arriveTime: "", arriveTZ: 9, airline: "", transitStops: "", cls: "", price: 0, miles: false, memo: "", status: "候補", paymentStatus: "未払い" };
    update(tr => ({ ...tr, itinerary: normalizeItinerary([...tr.itinerary, x]) })); setSheet({ kind: "transit", id: x.id, back });
  };
  const addLocal = (date, back) => {
    const tr0 = draftRef.current, r = tripRange(tr0);
    const d = isISO(date) ? date : r ? r.start : todayISO();
    const stay = staysOf(tr0).find(s => s.startDate && d >= s.startDate && d < stayEnd(s));
    const l = { id: uid(), linkedStayId: stay ? stay.id : null, category: "観光", desc: "", address: "", fromAddress: "", toAddress: "", date: d, startTime: "", endTime: "", mode: "", price: 0, people: 1, needsBooking: false, memo: "", paymentStatus: "未払い", status: "候補" };
    update(tr => ({ ...tr, localTransport: [...(tr.localTransport || []), l] })); setSheet({ kind: "local", id: l.id, back });
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
        <h1>{FEATURES.appName || "旅行プランナー"}</h1>
        <p className="muted">旅行ごとに、日程・宿・移動・予算・持ち物をまとめて管理します。最初の旅行を作ってください。</p>
        <TripsSheet trips={[]} currentId={null} onPick={() => {}} onCreate={createTrip} onSettings={null} />
      </div>
      {FEATURES.account && <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => Store.signOut()}>ログアウト</button>}
    </div>
  );
  if (!draft) return <div className="empty" style={{ paddingTop: 80 }}>読み込み中…</div>;

  const t = withBuiltinPhrases({ ...draft, phrases: { ...(draft.phrases || {}), ...Object.fromEntries(phraseDocs.map(p => [p.lang, p])) } });
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
  const todos = buildTodos(t, inbox.length);
  const mine = myShare(t);
  const openDay = (iso) => setSheet({ kind: "day", iso });
  const closeSheet = () => {
    // 何も入力せずに閉じた予定は残さない
    if (sheet && sheet.kind === "local") {
      const l = (draftRef.current.localTransport || []).find(x => x.id === sheet.id);
      if (l && !String(l.desc || "").trim() && !l.startTime && !Number(l.price) && !String(l.memo || "").trim()) update(tr => ({ ...tr, localTransport: tr.localTransport.filter(x => x.id !== sheet.id) }));
    }
    setSheet(sheet && sheet.back ? { kind: "day", iso: sheet.back } : null);
  };
  const openCount = staysOf(t).filter(s => isOpenState(stayState(t, s))).length + transitsOf(t).filter(x => isOpenState(transitState(x))).length + (t.localTransport || []).filter(l => isOpenState(localState(l))).length;
  const mail = <MailCard t={t} update={update} inbox={inbox} scan={scan} onScan={scanGmail} onPaste={pasteImport} onApply={applyInbox} onDecide={decide} />;
  const sheetTitle = sheet && ({ stay: "滞在と宿", transit: "移動", local: "予定", trips: "旅行", settings: "共有と設定", import: "ファイルの読み込み", add: "追加する", day: "その日の動き", shiori: "旅のしおり", suggest: "予定の提案", consult: "AIに相談", phrases: "旅のフレーズ集", emergency: "緊急時の情報" })[sheet.kind];

  return (
    <SuggestCtx.Provider value={sugg}>
    <div className="app">
      <header className={"topbar" + (scrolled ? " scrolled" : "")}>
        <button className="tripbtn" onClick={() => setSheet({ kind: "trips" })} aria-label={`旅行を切り替える（今は${t.name}）`}><span>{t.name}</span><Icon n="down" s={16} /></button>
        <div className="spacer" />
        <button className="iconbtn" aria-label="その他のメニュー" aria-expanded={menu} onClick={() => setMenu(!menu)} style={{ position: "relative" }}><Icon n="dots" />{typeof TrunkMenuBadge === "function" && <TrunkMenuBadge tripId={tripId} />}</button>
      </header>
      <nav className="nav" aria-label="メインメニュー">
        {NAV.map(([k, l, ic]) => (
          <button key={k} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>
            <span className="navicon"><Icon n={ic} s={22} />{k === "book" && (inbox.length || openCount) > 0 && <span className="badge">{inbox.length || openCount}</span>}</span>{l}
          </button>
        ))}
      </nav>
      <main className="main">
        {tab === "home" && typeof TrunkPassBanner === "function" && <TrunkPassBanner onTrips={() => setSheet({ kind: "trips" })} />}
        {tab === "home" && typeof TrunkRequestsBanner === "function" && <TrunkRequestsBanner tripId={tripId} onOpen={() => setSheet({ kind: "settings", section: "share" })} />}
        {tab === "home" && typeof TrunkAfterTrip === "function" && <TrunkAfterTrip t={t} tripId={tripId} />}
        {tab === "home" && <HomeView t={t} stats={stats} mine={mine} openDay={openDay} openPhrases={() => setSheet({ kind: "phrases" })} openEmergency={() => setSheet({ kind: "emergency" })} openShiori={() => setSheet({ kind: "shiori" })} openSettings={() => setSheet({ kind: "settings", section: "trip" })} todos={todos} onTodo={onTodo} inboxCount={inbox.length} scan={scan} onScan={scanGmail} go={setTab} />}
        {tab === "plan" && <PlanView t={t} view={planView} setView={setPlanView} onEdit={setSheet} onAdd={() => setSheet({ kind: "add" })} onAddLocal={(d) => addLocal(d)} onAddMove={(d) => addTransit(d)} onGuessGeo={guessGeo} guessing={guessing} onSuggest={FEATURES.ai ? (d) => setSheet({ kind: "suggest", iso: d }) : (d) => setSheet({ kind: "consult", topic: "day", iso: d })} />}
        {tab === "book" && <BookView t={t} filter={bookFilter} setFilter={setBookFilter} onEdit={setSheet} onAddLocal={() => addLocal()} mail={FEATURES.mail ? mail : null} entry={FEATURES.ai ? <EntryChecks t={t} update={update} /> : null} />}
        {tab === "money" && <MoneyView t={t} stats={stats} update={update} />}
        {tab === "pack" && <PackView t={packT} update={packUpdate} />}
      </main>
      {menu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setMenu(false)} />
          <div className="menu" role="menu">
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "settings" }); }}>{FEATURES.claudeShare ? "共有と設定（リクエストの取り込み）" : "共有と設定"}{typeof TrunkMenuBadge === "function" && <TrunkMenuBadge tripId={tripId} inline />}</button>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "trips" }); }}>旅行を切り替える・追加する</button>
            <hr />
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "shiori" }); }}>旅のしおり（PDFで保存）</button>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "phrases" }); }}>旅のフレーズ集</button>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "emergency" }); }}>緊急時の情報</button>
            <button role="menuitem" onClick={exportICS}>カレンダー用に書き出す（.ics）</button>
            <button role="menuitem" onClick={() => { setMenu(false); setSheet({ kind: "consult" }); }}>AIに相談（ChatGPT・Claude など）</button>
            <button role="menuitem" onClick={exportJSON}>データを書き出す（JSON）</button>
            <button role="menuitem" onClick={() => { setMenu(false); fileRef.current && fileRef.current.click(); }}>データを読み込む（JSON）</button>
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
      {sheet && (
        <Sheet title={sheetTitle} onClose={closeSheet} full={sheet.kind === "shiori"}>
          {sheet.kind === "shiori" && <ShioriView t={packT} canExport update={update} />}
          {sheet.kind === "emergency" && <EmergencyView t={t} update={update} canEdit />}
          {sheet.kind === "consult" && <ConsultView t={t} update={update} initialTopic={sheet.topic} initialIso={sheet.iso} done={(m) => { toast(m); closeSheet(); }} />}
          {sheet.kind === "phrases" && <PhraseView t={t} onSave={((tid) => (p) => Store.setPhrase(tid, p))(tripId)} canGenerate={FEATURES.ai} onConsult={FEATURES.ai ? null : () => setSheet({ kind: "consult", topic: "phrase" })} />}
          {sheet.kind === "suggest" && <DaySuggest t={t} iso={sheet.iso} update={update} done={(n) => { toast(`${n}件の予定を追加しました`); closeSheet(); }} />}
          {sheet.kind === "day" && <DayDetail t={t} iso={sheet.iso} setIso={(iso) => setSheet({ kind: "day", iso })} onEdit={(e) => setSheet({ ...e, back: sheet.iso })} onAddLocal={(d) => addLocal(d, d)} onAddMove={(d) => addTransit(d, d)} onSuggest={FEATURES.ai ? (d) => setSheet({ kind: "suggest", iso: d, back: d }) : (d) => setSheet({ kind: "consult", topic: "day", iso: d, back: d })} />}
          {sheet.kind === "stay" && <StayEditor t={t} id={sheet.id} update={update} close={closeSheet} />}
          {sheet.kind === "transit" && <TransitEditor t={t} id={sheet.id} update={update} close={closeSheet} />}
          {sheet.kind === "local" && <LocalEditor t={t} id={sheet.id} update={update} close={closeSheet} />}
          {sheet.kind === "add" && (
            <div className="card flush divide">
              {[["bed", "滞在（都市・宿）", addStay], ["route", "移動（飛行機・電車・バス・タクシーなど）", () => addTransit()], ["ticket", "予定（観光・食事・ツアーなど）", () => addLocal()]].map(([ic, l, f]) => (
                <button key={l} className="bookrow" style={{ gridTemplateColumns: "36px minmax(0,1fr)" }} onClick={f}><span className="ico open" style={{ background: "var(--sunk)", color: "var(--ink)" }}><Icon n={ic} /></span><span className="t1">{l}</span></button>
              ))}
            </div>
          )}
          {sheet.kind === "trips" && <TripsSheet limited={atLimit} trips={trips} currentId={tripId} onPick={pickTrip} onCreate={createTrip} onSettings={() => setSheet({ kind: "settings" })} />}
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
  );
}

