// ================= 出発前の手続き・支出・通貨・緊急時の情報 =================
async function askClaudeJSON(prompt) {
  if (!FEATURES.ai) return null;
  const sample = await useCap("sample");
  if (!sample) throw { code: "nosample" };
  return sample.json(prompt, { modelTier: "default" });
}
const askErr = (e) => e && e.code === "nosample" ? "この表示ではClaudeを呼び出せません" : e && e.code === "not_granted" ? "Claudeの利用が許可されませんでした" : "うまく作れませんでした。もう一度お試しください";

// ---- 出発前の手続き ----
function EntryChecks({ t, update }) {
  const [st, setSt] = useState({ s: "idle", msg: "" });
  const checks = t.entryChecks || null;
  const countries = tripCountries(t);
  if (!countries.length) return null;
  const run = async () => {
    setSt({ s: "busy", msg: "" });
    try {
      const res = await askClaudeJSON(entryPrompt(t));
      const prev = checks ? checks.items : [];
      const items = (res && Array.isArray(res.items) ? res.items : []).filter(i => i && i.title).map(i => {
        const old = prev.find(p => p.title === i.title && p.country === i.country);
        return { id: old ? old.id : uid(), country: String(i.country || ""), title: String(i.title), detail: String(i.detail || ""), applyBy: isISO(i.apply_by) ? i.apply_by : "", url: /^https?:\/\//.test(i.url || "") ? i.url : "", done: old ? !!old.done : false };
      });
      update(tr => ({ ...tr, entryChecks: { generatedAt: new Date().toISOString(), items } }));
      setSt({ s: "idle", msg: "" });
    } catch (e) { setSt({ s: "err", msg: askErr(e) }); }
  };
  const toggle = (id, done) => update(tr => ({ ...tr, entryChecks: { ...tr.entryChecks, items: tr.entryChecks.items.map(i => i.id === id ? { ...i, done } : i) } }));
  const items = checks ? [...checks.items].sort((a, b) => (a.done - b.done) || (a.applyBy || "9").localeCompare(b.applyBy || "9")) : [];
  const left = items.filter(i => !i.done).length;
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <div className="row" style={{ flexWrap: "nowrap", gap: 12 }}>
        <span className="ico open"><Icon n="check" /></span>
        <span style={{ flex: 1, minWidth: 0 }}><span className="t1">出発前の手続き{checks ? `（残り${left}件）` : ""}</span><span className="t2" style={{ whiteSpace: "normal" }}>{countries.map(c => c.country).join("・")}に入国するために必要なもの</span></span>
        {FEATURES.ai && <button className="btn small" disabled={st.s === "busy"} onClick={run}>{st.s === "busy" ? "調べています…" : checks ? "作り直す" : "Claudeに洗い出してもらう"}</button>}
      </div>
      {st.msg && <div className="err">{st.msg}</div>}
      {items.length > 0 && (
        <div className="divide" style={{ borderTop: "1px solid var(--sunk)" }}>
          {items.map(i => (
            <label key={i.id} className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap", gap: 10, padding: "10px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={i.done} onChange={e => toggle(i.id, e.target.checked)} style={{ width: 20, height: 20, marginTop: 2, accentColor: "var(--ink)", flex: "none" }} />
              <span style={{ minWidth: 0 }}>
                <span className="t1" style={{ whiteSpace: "normal", textDecoration: i.done ? "line-through" : "none", color: i.done ? "var(--faint)" : undefined }}>{i.title}</span>
                <span className="xs muted" style={{ display: "block" }}>{i.country}{i.applyBy ? ` ・ ${md(i.applyBy)}までに` : ""}</span>
                {!i.done && i.detail && <span className="small" style={{ display: "block", color: "var(--muted)" }}>{i.detail}</span>}
                {!i.done && safeUrl(i.url) && <a className="xs" href={safeUrl(i.url)} target="_blank" rel="noopener noreferrer">公式サイト</a>}
              </span>
            </label>
          ))}
        </div>
      )}
      {checks && <div className="xs muted">Claudeの知識にもとづく一覧です。制度は変わることがあるので、必ず公式サイトや外務省の海外安全ホームページで確認してください。</div>}
    </section>
  );
}

// ---- 主な国の緊急番号（AI を使わない版でも出す。大使館は外務省のページで確かめてもらう） ----
const EU112 = { general: "112", note: "EU などで共通の緊急番号です（警察・救急・消防）" };
const EMERGENCY_NUM = {
  "台湾": { police: "110", ambulance: "119", fire: "119" }, "韓国": { police: "112", ambulance: "119", fire: "119" },
  "香港": { general: "999" }, "マカオ": { general: "999" }, "中国": { police: "110", ambulance: "120", fire: "119" },
  "タイ": { police: "191", ambulance: "1669", fire: "199", note: "観光警察 1155（英語可）" }, "シンガポール": { police: "999", ambulance: "995", fire: "995" },
  "マレーシア": { general: "999" }, "ベトナム": { police: "113", ambulance: "115", fire: "114" }, "フィリピン": { general: "911" },
  "インドネシア": { general: "112", police: "110", ambulance: "118" }, "インド": { general: "112" }, "UAE": { police: "999", ambulance: "998", fire: "997" },
  "カタール": { general: "999" }, "トルコ": { general: "112" }, "アメリカ（ハワイ）": { general: "911" }, "グアム": { general: "911" }, "サイパン": { general: "911" },
  "アメリカ": { general: "911" }, "カナダ": { general: "911" }, "オーストラリア": { general: "000" }, "イギリス": { general: "999", note: "112 でもつながります" },
  ...Object.fromEntries(["アイルランド", "ポルトガル", "フランス", "ベルギー", "オランダ", "ルクセンブルク", "ドイツ", "スイス", "オーストリア", "チェコ", "スロバキア", "ハンガリー", "ポーランド", "デンマーク", "スウェーデン", "ノルウェー", "フィンランド", "エストニア", "ラトビア", "リトアニア", "スペイン", "イタリア", "クロアチア", "スロベニア", "ギリシャ", "マルタ"].map(c => [c, EU112])),
};

// ---- 通貨 ----
function CurrencyCard({ t, update }) {
  const curs = tripCurrencies(t);
  const [cur, setCur] = useState(curs[0] || "EUR");
  const [amt, setAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const autoTried = useRef(false);
  useEffect(() => { if (autoTried.current || FEATURES.ai || !curs.length || !curs.some(c => !hasRate(t, c))) return; autoTried.current = true; fetchRatesRef.current && fetchRatesRef.current(true); });
  const fetchRatesRef = useRef(null);
  if (!curs.length) return null;
  const rate = Number((t.rates || {})[cur]) || 0;
  const guess = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await askClaudeJSON(ratesPrompt(curs));
      const r = {}; Object.entries((res && res.rates) || {}).forEach(([k, v]) => { if (curs.includes(k) && Number(v) > 0) r[k] = Math.round(Number(v) * 10000) / 10000; });
      update(tr => ({ ...tr, rates: { ...(tr.rates || {}), ...r }, ratesAsOf: (res && res.as_of) || "" }));
      setMsg(`目安のレートを入れました${res && res.as_of ? `（${res.as_of}ごろ）` : ""}。両替やカードのレートとは違うので、必要なら直してください`);
    } catch (e) { setMsg(askErr(e)); }
    setBusy(false);
  };
  // 最新のレート（ExchangeRate-API・無料・キー不要）。AI を使わない版では、こちらで目安を入れる
  const fetchRates = fetchRatesRef.current = async (silent) => {
    setBusy(true); if (!silent) setMsg("");
    try {
      const d = await (await fetch("https://open.er-api.com/v6/latest/JPY")).json();
      const r = {}; curs.forEach(k => { const v = Number(d && d.rates && d.rates[k]); if (v > 0) r[k] = Math.round(10000 / v) / 10000; });
      if (Object.keys(r).length) {
        update(tr => ({ ...tr, rates: { ...(tr.rates || {}), ...r }, ratesAsOf: todayISO() }));
        setMsg("今日の目安のレートを入れました。両替やカードのレートとは少し違うので、必要なら直してください");
      }
    } catch (e) { if (!silent) setMsg("レートを取得できませんでした。手で入れてください"); }
    setBusy(false);
  };
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <div className="row between"><h3>通貨の換算</h3>{!FEATURES.ai && <button className="btn small" disabled={busy} onClick={() => fetchRates(false)}>{busy ? "取得しています…" : "最新のレートにする"}</button>}{FEATURES.ai && <button className="btn small" disabled={busy} onClick={guess}>{busy ? "調べています…" : "Claudeで目安のレートを入れる"}</button>}</div>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <input className="input mono" type="number" inputMode="decimal" aria-label="金額" placeholder="金額" value={amt} onChange={e => setAmt(e.target.value)} />
        <select className="input" style={{ width: "auto" }} aria-label="通貨" value={cur} onChange={e => setCur(e.target.value)}>{curs.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{amt && rate ? `= ${yen(Number(amt) * rate)}` : rate ? `1 ${cur} = ${rate}円` : "レートが未入力です"}</div>
      {amt && rate > 0 && <div className="xs muted mono">{yen(Number(amt))} = {(Number(amt) / rate).toLocaleString("ja-JP", { maximumFractionDigits: 2 })} {cur}（円を外貨にした場合）</div>}
      <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))" }}>
        {curs.map(c => (
          <Field key={c} label={`1 ${c}（${CUR_NAME[c] || c}）＝ 円`}><NumIn value={(t.rates || {})[c] || ""} onChange={v => update(tr => ({ ...tr, rates: { ...(tr.rates || {}), [c]: v } }))} step="0.0001" /></Field>
        ))}
      </div>
      {msg && <div className="note">{msg}</div>}
    </section>
  );
}

// ---- 支出 ----
// 誰の分か：選んでいる人は ✓ つき、外した人は薄い枠。「全員」で全員に戻す
function SplitChips({ people, value, onChange }) {
  const all = people.every(p => value.includes(p));
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="small muted">誰の分か（押すと外れます）</span>
      <div className="chips split-chips">
        <button className="chip" aria-pressed={all} onClick={() => onChange([...people])}>{all && <Icon n="check" s={12} />}全員</button>
        {people.map(p => { const on = value.includes(p); return <button key={p} className="chip" aria-pressed={on} disabled={on && value.length === 1} onClick={() => onChange(on ? value.filter(x => x !== p) : people.filter(x => x === p || value.includes(x)))}>{on && <Icon n="check" s={12} />}{p}</button>; })}
      </div>
    </div>
  );
}
function ExpenseView({ t, update }) {
  const people = t.participants || [];
  const curs = ["JPY", ...tripCurrencies(t)];
  const r = tripRange(t), today = todayISO();
  const defDate = r && today >= r.start && today <= r.end ? today : r ? r.start : today;
  const blank = () => ({ date: defDate, title: "", amount: "", currency: curs[1] || "JPY", payer: t.myName || people[0] || "", split: [...people], category: "食事", budgetId: budgetLinkGuess(t, "食事") });
  const bRows = budgetManualRows(t);
  // 予算の項目（手入力の項目だけ）。選ぶと、その項目の実費は支出の合計になる
  const budgetSel = (value, onChange) => bRows.length > 0 && <Field label="予算の項目"><select value={value || ""} onChange={ev => onChange(ev.target.value)}><option value="">予算に入れない</option>{bRows.map(b => <option key={b.id} value={String(b.id)}>{b.category || "（名前なし）"}</option>)}</select></Field>;
  const [f, setF] = useState(blank);
  const [more, setMore] = useState(false);
  const list = [...(t.expenses || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const total = list.reduce((a, e) => a + toJPY(t, e.amount, e.currency), 0);
  const noRate = uniq(list.filter(e => !hasRate(t, e.currency)).map(e => e.currency));
  const add = () => {
    if (!String(f.title).trim() || !(Number(f.amount) > 0)) return;
    update(tr => ({ ...tr, expenses: [...(tr.expenses || []), { id: uid(), ...f, title: f.title.trim(), amount: Number(f.amount) }] }));
    setF({ ...blank(), date: f.date, currency: f.currency, payer: f.payer, category: f.category, budgetId: f.budgetId });
  };
  // 予約済みの宿・移動・予定を、そのまま支出に入れる（払った人は自分、割り勘は全員。あとで直せる）
  const cands = bookedExpenseCandidates(t);
  const [bPayer, setBPayer] = useState("");
  const [editId, setEditId] = useState(null);
  const addBooked = (list) => update(tr => {
    const have = new Set((tr.expenses || []).map(e => e.src).filter(Boolean));
    const payer = (bPayer && (tr.participants || []).includes(bPayer) ? bPayer : "") || t.myName || (tr.participants || [])[0] || "";
    const rows = list.filter(c => !have.has(c.src)).map(c => ({ id: uid(), src: c.src, date: c.date || defDate, title: c.title, amount: c.amount, currency: "JPY", payer, split: [...(tr.participants || [])], category: c.category }));
    return { ...tr, expenses: [...(tr.expenses || []), ...rows] };
  });
  const byCat = EXP_CATS.map(c => [c, list.filter(e => e.category === c).reduce((a, e) => a + toJPY(t, e.amount, e.currency), 0)]).filter(([, v]) => v > 0);
  return (
    <div className="stack">
      <section className="card stack" style={{ gap: 10 }}>
        <h3>支出を記録</h3>
        <div className="fgrid">
          <Field label="内容" wide><TextIn value={f.title} onChange={v => setF({ ...f, title: v })} placeholder="例：ランチ、地下鉄、お土産" /></Field>
          <Field label="金額" wide={people.length === 0}><div className="row" style={{ flexWrap: "nowrap", gap: 6 }}><input type="number" inputMode="decimal" style={{ flex: 1, minWidth: 0 }} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /><select aria-label="通貨" style={{ width: 74, flex: "none", paddingRight: 4 }} value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>{curs.map(c => <option key={c} value={c}>{c}</option>)}</select></div></Field>
          {people.length > 0 && <Field label="払った人"><select value={f.payer} onChange={e => setF({ ...f, payer: e.target.value })}>{people.map(p => <option key={p}>{p}</option>)}</select></Field>}
          {more && <>
            <Field label="日付"><DateIn value={f.date} onChange={v => setF({ ...f, date: v })} /></Field>
            <Field label="種類"><select value={f.category} onChange={e => setF({ ...f, category: e.target.value, budgetId: budgetLinkGuess(t, e.target.value) })}>{EXP_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
            {budgetSel(f.budgetId, v => setF({ ...f, budgetId: v }))}
          </>}
        </div>
        {more && people.length > 1 && <SplitChips people={people} value={f.split} onChange={v => setF({ ...f, split: v })} />}
        {!more && <button className="linkbtn small" style={{ alignSelf: "flex-start" }} onClick={() => setMore(true)}>{md(f.date)} ・ {f.category}{people.length > 1 ? ` ・ ${people.every(p => f.split.includes(p)) ? "全員の分" : f.split.join("・") + "の分"}` : ""} ・ <u>日付・種類・誰の分かを変える</u></button>}
        {f.amount && f.currency !== "JPY" && <div className="small muted mono">{hasRate(t, f.currency) ? `≒ ${yen(toJPY(t, f.amount, f.currency))}` : "この通貨のレートが未入力です（下の「通貨の換算」で入れられます）"}</div>}
        <button className="btn primary" disabled={!f.title.trim() || !(Number(f.amount) > 0)} onClick={add}>記録する</button>
        {people.length === 0 && <div className="xs muted">「精算」で参加者を登録すると、払った人と割り勘の相手を選べます。</div>}
      </section>
      {cands.length > 0 && (
        <section className="card stack" style={{ gap: 8 }}>
          <div className="row between"><h3>予約したものを支出に入れる</h3>{cands.length > 1 && <button className="btn small" onClick={() => addBooked(cands)}>まとめて入れる</button>}</div>
          <div className="xs muted">予約済み・支払い済みで金額が入っているものです。{people.length > 1 ? "参加者全員の割り勘として入ります。途中から来る人などは、入れたあと「これまでの支出」で直せます。" : ""}</div>
          {people.length > 1 && <label className="row small" style={{ gap: 8 }}>払った人<select className="input" style={{ width: "auto" }} value={bPayer && people.includes(bPayer) ? bPayer : (t.myName || people[0])} onChange={e => setBPayer(e.target.value)}>{people.map(p => <option key={p}>{p}</option>)}</select></label>}
          <div className="divide">
            {cands.map(c => (
              <div key={c.src} className="row between" style={{ flexWrap: "nowrap", padding: "8px 0" }}>
                <span style={{ minWidth: 0 }}><span className="t1">{c.title}</span><span className="xs muted">{c.date ? md(c.date) + " ・ " : ""}{c.category}</span></span>
                <span className="row" style={{ flexWrap: "nowrap", gap: 8 }}><span className="mono">{yen(c.amount)}</span><button className="btn small" onClick={() => addBooked([c])}>入れる</button></span>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="card stack" style={{ gap: 8 }}>
        <div className="row between"><h3>これまでの支出</h3><span className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{yen(total)}</span></div>
        {byCat.length > 0 && <div className="xs muted">{byCat.map(([c, v]) => `${c} ${yen(v)}`).join(" ・ ")}</div>}
        {noRate.length > 0 && <div className="xs" style={{ color: "var(--orange)" }}>{noRate.join("・")}のレートが未入力のため、合計に入っていません</div>}
        {!list.length && <p className="empty">まだ記録がありません。</p>}
        <div className="divide">
          {list.map(e => {
            const sp = e.split && e.split.length ? e.split : people;
            const setE = (patch) => update(tr => ({ ...tr, expenses: tr.expenses.map(x => x.id === e.id ? { ...x, ...patch } : x) }));
            const editing = editId === e.id;
            return (
              <div key={e.id} style={{ padding: "8px 0" }}>
                <div className="row between" style={{ flexWrap: "nowrap" }}>
                  <button style={{ minWidth: 0, flex: 1, textAlign: "left", background: "none", border: 0, padding: 0, color: "inherit", cursor: "pointer" }} aria-expanded={editing} onClick={() => setEditId(editing ? null : e.id)}>
                    <span className="t1">{e.title}</span><span className="xs muted">{md(e.date)} ・ {e.category}{(() => { const b = bRows.find(x => String(x.id) === String(e.budgetId)); return b && b.category !== e.category ? `（予算：${b.category}）` : ""; })()}{e.payer ? ` ・ ${e.payer}が払った` : ""}{people.length > 1 && sp.length < people.length ? `（${sp.join("・")}の分）` : ""}{editing ? "" : " ・ 直す"}</span>
                  </button>
                  <span className="row" style={{ flexWrap: "nowrap", gap: 4 }}>
                    <span style={{ textAlign: "right" }}><span className="mono" style={{ display: "block" }}>{e.currency === "JPY" ? yen(e.amount) : `${Number(e.amount).toLocaleString("ja-JP")} ${e.currency}`}</span>{e.currency !== "JPY" && hasRate(t, e.currency) && <span className="xs muted mono">≒ {yen(toJPY(t, e.amount, e.currency))}</span>}</span>
                    <button className="iconbtn" aria-label={`${e.title}を削除`} onClick={() => update(tr => ({ ...tr, expenses: tr.expenses.filter(x => x.id !== e.id) }))}><Icon n="x" s={16} /></button>
                  </span>
                </div>
                {editing && (
                  <div className="stack" style={{ gap: 8, marginTop: 8, background: "var(--sunk)", borderRadius: 12, padding: 12 }}>
                    <div className="fgrid">
                      <Field label="内容" wide><TextIn value={e.title} onChange={v => setE({ title: v })} /></Field>
                      <Field label="金額"><input type="number" inputMode="decimal" value={e.amount} onChange={ev => setE({ amount: Number(ev.target.value) || 0 })} /></Field>
                      <Field label="通貨"><select value={e.currency} onChange={ev => setE({ currency: ev.target.value })}>{uniq([...curs, e.currency]).map(c => <option key={c} value={c}>{c}（{CUR_NAME[c] || c}）</option>)}</select></Field>
                      <Field label="日付"><DateIn value={e.date} onChange={v => setE({ date: v })} /></Field>
                      <Field label="種類"><select value={e.category} onChange={ev => setE({ category: ev.target.value })}>{EXP_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
                      {!e.src && budgetSel(e.budgetId, v => setE({ budgetId: v }))}
                      {people.length > 0 && <Field label="払った人"><select value={people.includes(e.payer) ? e.payer : ""} onChange={ev => setE({ payer: ev.target.value })}>{!people.includes(e.payer) && <option value="">選ぶ</option>}{people.map(p => <option key={p}>{p}</option>)}</select></Field>}
                    </div>
                    {people.length > 1 && <SplitChips people={people} value={sp} onChange={v => setE({ split: v })} />}
                    <div className="row"><button className="btn small" onClick={() => setEditId(null)}>閉じる</button></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <CurrencyCard t={t} update={update} />
    </div>
  );
}
function ExpenseSettle({ t }) {
  const people = t.participants || [];
  if (people.length < 2 || !(t.expenses || []).length) return null;
  const { bal, moves } = expenseSettlement(t);
  return (
    <section className="card stack" style={{ gap: 8 }}>
      <h3>実際の支払いから精算</h3>
      <div className="xs muted">「支出」に記録した支払いを、割り勘の相手で分けた結果です（外貨は入力したレートで円にしています）。</div>
      <div className="divide">{people.map(p => <div key={p} className="row between" style={{ padding: "6px 0" }}><span>{p}</span><span className={"mono" + (bal[p] < 0 ? " over" : "")}>{bal[p] >= 0 ? "受け取り " : "支払い "}{yen(Math.abs(bal[p]))}</span></div>)}</div>
      {moves.map((m, i) => <div key={i} className="row between" style={{ background: "var(--sunk)", borderRadius: 10, padding: "8px 12px" }}><span>{m.from} → {m.to}</span><b className="mono">{yen(m.amount)}</b></div>)}
      {!moves.length && <div className="small muted">精算は必要ありません。</div>}
    </section>
  );
}

// ---- 緊急時の情報 ----
function EmergencyView({ t, update, canEdit }) {
  const em = t.emergency || {};
  const [st, setSt] = useState({ s: "idle", msg: "" });
  const set = (patch) => update(tr => ({ ...tr, emergency: { ...(tr.emergency || {}), ...patch } }));
  const countries = tripCountries(t);
  const run = async () => {
    setSt({ s: "busy", msg: "" });
    try {
      const res = await askClaudeJSON(emergencyPrompt(t));
      const list = (res && Array.isArray(res.countries) ? res.countries : []).filter(c => c && c.country);
      update(tr => ({ ...tr, emergencyCountries: list }));
      setSt({ s: "idle", msg: "" });
    } catch (e) { setSt({ s: "err", msg: askErr(e) }); }
  };
  const tel = (n) => n ? <span className="mono" style={{ userSelect: "all" }}>{n}</span> : <span className="muted">—</span>;
  return (
    <div className="stack">
      {canEdit && (
        <section className="card stack" style={{ gap: 10 }}>
          <h3>自分の情報</h3>
          <div className="xs muted">ここに入れた情報はこの旅行の「しおり（PDF）」に入ります。共有ページには入りません。</div>
          <div className="fgrid">
            <Field label="名前（ローマ字・パスポートと同じ）" wide><TextIn value={em.nameEn} onChange={v => set({ nameEn: v.toUpperCase() })} placeholder="例：YAMADA HANAKO" autoComplete="off" /></Field>
            <Field label="パスポート番号"><TextIn value={em.passportNo} onChange={v => set({ passportNo: v })} autoComplete="off" /></Field>
            <Field label="パスポートの有効期限"><DateIn value={em.passportExp} onChange={v => set({ passportExp: v })} /></Field>
            <Field label="海外旅行保険の会社"><TextIn value={em.insurer} onChange={v => set({ insurer: v })} /></Field>
            <Field label="証券番号"><TextIn value={em.policyNo} onChange={v => set({ policyNo: v })} /></Field>
            <Field label="保険会社の緊急連絡先" wide><TextIn value={em.insurerPhone} onChange={v => set({ insurerPhone: v })} placeholder="例：+81-3-xxxx-xxxx（24時間）" /></Field>
            <Field label="家族などの連絡先" wide><textarea value={em.contacts || ""} onChange={e => set({ contacts: e.target.value })} placeholder="例：母 090-xxxx-xxxx" /></Field>
            <Field label="アレルギー・持病・常備薬など" wide><textarea value={em.medical || ""} onChange={e => set({ medical: e.target.value })} /></Field>
          </div>
          {em.passportExp && r6(t, em.passportExp) && <div className="err">パスポートの有効期限が、帰国日から6か月未満です。国によっては入国できないので確認してください。</div>}
        </section>
      )}
      {countries.length > 0 && (
        <section className="card stack" style={{ gap: 10 }}>
          <div className="row between"><h3>各国の緊急連絡先</h3>{canEdit && FEATURES.ai && <button className="btn small" disabled={st.s === "busy"} onClick={run}>{st.s === "busy" ? "調べています…" : (t.emergencyCountries || []).length ? "調べ直す" : "Claudeに調べてもらう"}</button>}</div>
          {st.msg && <div className="err">{st.msg}</div>}
          {(t.emergencyCountries || []).map((c, i) => (
            <div key={i} className="inboxitem" style={{ gap: 4 }}>
              <b>{c.country}</b>
              <div className="small">緊急 {tel(c.general)} ・ 警察 {tel(c.police)} ・ 救急 {tel(c.ambulance)} ・ 消防 {tel(c.fire)}</div>
              {c.embassy && c.embassy.name && <div className="small">{c.embassy.name}：{tel(c.embassy.phone)}<span className="xs muted" style={{ display: "block" }}>{c.embassy.address}</span></div>}
              {c.note && <div className="xs muted">{c.note}</div>}
            </div>
          ))}
          {!(t.emergencyCountries || []).length && countries.map(c => { const n = EMERGENCY_NUM[c.country]; return n && (
            <div key={c.country} className="inboxitem" style={{ gap: 4 }}>
              <b>{c.country}</b>
              <div className="small">{[["緊急", n.general], ["警察", n.police], ["救急", n.ambulance], ["消防", n.fire]].filter(x => x[1]).map(([k, v], i) => <span key={k}>{i ? " ・ " : ""}{k} <a className="mono" href={`tel:${v}`}>{v}</a></span>)}</div>
              {n.note && <div className="xs muted">{n.note}</div>}
            </div>); })}
          {!(t.emergencyCountries || []).length && <p className="empty">{canEdit && FEATURES.ai ? "「Claudeに調べてもらう」で、警察・救急の番号と日本大使館の連絡先をまとめます。" : <>警察・救急の番号と日本大使館の連絡先は、外務省の<a href="https://www.anzen.mofa.go.jp/" target="_blank" rel="noopener noreferrer">海外安全ホームページ</a>で確かめられます。</>}</p>}
          {(t.emergencyCountries || []).length > 0 && <div className="xs muted">番号はClaudeの知識にもとづく目安です。外務省の海外安全ホームページ等で確認してください。</div>}
        </section>
      )}
    </div>
  );
}
// 帰国日から6か月未満か
function r6(t, exp) { const r = tripRange(t); return r && isISO(exp) && dayDiff(r.end, exp) < 183; }


// ================= 天気と服装の目安（日ごとの画面） =================
// FEATURES.weatherBase（Trunk. は s.trunk-travelplanner.com）から、予報（約9日先まで）か、それより先なら平年値を取る
const WX_MEMO = new Map();
const wxGet = (url) => { if (!WX_MEMO.has(url)) WX_MEMO.set(url, fetch(url).then(r => r.ok ? r.json() : null).catch(() => null)); return WX_MEMO.get(url); };
// その日にいる場所：泊まる宿の都市、最終日は前の晩の宿の都市
function wxPlace(t, iso) {
  const stays = staysOf(t).filter(s => isISO(s.startDate));
  const s = stays.find(x => iso >= x.startDate && iso < stayEnd(x)) || stays.find(x => stayEnd(x) === iso);
  if (!s) return null;
  const h = hotelOf(t, s) || {};
  const ll = h.geo || (typeof geoFor === "function" && (geoFor(h.name, t.geo) || geoFor(s.city, t.geo)));
  if (!ll) return null;
  const tz = tzMatch(s.city);
  return { ll, tz: tz ? tzOffset(tz.zone, iso) : 9, city: splitCity(s.city).main };
}
// 服装の目安（最高・最低気温と雨から）
function wearFor(w) {
  const k = [], hi = w.max, lo = w.min;
  if (hi >= 25) k.push("tshirt"); else if (hi >= 20) k.push("longsleeve"); else if (hi >= 15) k.push("longsleeve", "cardigan"); else if (hi >= 10) k.push("sweater"); else if (hi >= 5) k.push("coat"); else k.push("coat", "warm");
  if (hi >= 20 && hi - lo >= 8 && !k.includes("cardigan")) k.push("cardigan");
  if (w.rain >= 1 || /rain|sleet|snow|shower/.test(w.symbol || "")) k.push("umbrella");
  else if (hi >= 25 && /clearsky|fair/.test(w.symbol || "")) k.push("hat");
  const tip = w.rain >= 1 || /rain|shower/.test(w.symbol || "") ? "雨の予報です。折りたたみ傘があると安心です。"
    : hi - lo >= 10 ? "朝晩は冷えます。羽織るものがあると安心です。"
    : hi >= 28 ? "暑くなりそうです。帽子と水分を忘れずに。"
    : hi < 5 ? "かなり冷えます。手袋やマフラーがあると安心です。" : "";
  return { keys: k.slice(0, 3), tip };
}
const WEAR_NAME = { tshirt: "半袖", longsleeve: "長袖", cardigan: "薄手の上着", sweater: "セーター", coat: "コート", warm: "マフラー・手袋", hat: "帽子", umbrella: "折りたたみ傘" };
const WEAR_SVG = {
  tshirt: <><path d="M24 10l-12 6-6 12 9 4 3-6v28h28V26l3 6 9-4-6-12-12-6" /><path d="M24 10c2 4 5 6 8 6s6-2 8-6" /></>,
  longsleeve: <><path d="M24 10l-11 5-6 32h7l4-24v31h28V23l4 24h7l-6-32-11-5" /><path d="M24 10c2 4 5 6 8 6s6-2 8-6" /><path d="M8 43h6M50 43h6" /></>,
  cardigan: <><path d="M24 9l-11 5-6 33h7l4-24v32h28V23l4 24h7l-6-33-11-5" /><path d="M24 9l8 18 8-18" /><path d="M32 27v27" /><circle cx="35" cy="34" r="1.2" fill="currentColor" /><circle cx="35" cy="42" r="1.2" fill="currentColor" /></>,
  sweater: <><path d="M24 11l-11 5-6 31h7l4-22v29h28V25l4 22h7l-6-31-11-5" /><path d="M24 11c1 5 4 7 8 7s7-2 8-7" /><path d="M18 50h28M8 47h6M50 47h6" /><path d="M22 30h20M22 37h20" stroke="var(--blue)" strokeDasharray="3 3" /></>,
  coat: <><path d="M23 8l-10 5-6 35h7l3-22v32h30V26l3 22h7l-6-35-10-5" /><path d="M23 8l-3 8 7 6 5-6 5 6 7-6-3-8" /><path d="M32 16v42" /><circle cx="28" cy="30" r="1.4" fill="currentColor" /><circle cx="28" cy="40" r="1.4" fill="currentColor" /><path d="M38 38h6" /></>,
  warm: <><path d="M10 18c4 6 14 9 22 9s16-3 20-9" /><path d="M10 18c0-3 2-5 4-5 4 4 11 6 18 6s14-2 18-6c2 0 4 2 4 5" /><path d="M22 26l-4 24h9l2-22" /><path d="M18 46h9M19 41h8M19 50v4M23 50v4M27 50v4" stroke="var(--blue)" /><path d="M42 34c0-3 2-5 5-5s5 2 5 5v12h-10z" /><path d="M42 40l-3-2c-2-1-4 1-3 3l4 5" /><path d="M42 46h10v4H42z" /></>,
  hat: <><path d="M20 36c0-10 5-18 12-18s12 8 12 18" /><path d="M8 38c4 4 14 6 24 6s20-2 24-6c-4-2-12-2-12-2H20s-8 0-12 2z" /><path d="M20 32h24" stroke="var(--blue)" /></>,
  umbrella: <><path d="M8 32c0-13 11-22 24-22s24 9 24 22c-3-3-6-3-8 0-2-3-6-3-8 0-2-3-6-3-8 0-2-3-6-3-8 0-2-3-5-3-8 0z" /><path d="M32 32v18a5 5 0 0 1-10 0" /><path d="M14 46l-2 4M50 44l-2 4M44 52l-2 4" stroke="var(--blue)" /></>,
};
const WearIcon = ({ k, s = 28 }) => <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{WEAR_SVG[k]}</svg>;
const WxIcon = ({ sym, s = 20 }) => {
  const k = /snow|sleet/.test(sym) ? "snow" : /rain|shower/.test(sym) ? "rain" : /cloudy|fog/.test(sym) && !/partly/.test(sym) ? "cloud" : /partly/.test(sym) ? "part" : "sun";
  const sun = <g stroke="#E8892B"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></g>;
  const cloud = <path d="M7 17a4 4 0 0 1 .5-8A5 5 0 0 1 17 10a3.5 3.5 0 0 1 0 7z" stroke="#5A6470" />;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {k === "sun" && sun}{k === "cloud" && cloud}
    {k === "part" && <><g transform="translate(-3 -3) scale(.8)">{sun}</g><path d="M9 19a3.5 3.5 0 0 1 .4-7A4.5 4.5 0 0 1 18 13a3 3 0 0 1 0 6z" stroke="#5A6470" fill="var(--surface)" /></>}
    {k === "rain" && <><path d="M7 15a4 4 0 0 1 .5-8A5 5 0 0 1 17 8a3.5 3.5 0 0 1 0 7z" stroke="#5A6470" /><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" stroke="var(--blue)" /></>}
    {k === "snow" && <><path d="M7 15a4 4 0 0 1 .5-8A5 5 0 0 1 17 8a3.5 3.5 0 0 1 0 7z" stroke="#5A6470" /><path d="M9 19h.01M13 20h.01M17 19h.01" stroke="var(--blue)" strokeWidth="3" /></>}
  </svg>;
};
function DayWeather({ t, iso }) {
  const base = typeof FEATURES !== "undefined" && FEATURES.weatherBase;
  const place = useMemo(() => base ? wxPlace(t, iso) : null, [t, iso, base]);
  const [w, setW] = useState(null);
  const key = place ? `${place.ll[0].toFixed(1)},${place.ll[1].toFixed(1)},${iso}` : "";
  useEffect(() => {
    setW(null);
    if (!place) return;
    const ahead = dayDiff(todayISO(), iso);
    if (ahead < -1) return; // 終わった日は出さない
    const [lat, lon] = place.ll;
    // 日ごとのカードには、実際の天気予報だけを出す（出発の9日前から）。それより前の平年値は、ホームに都市ごとに出す
    if (ahead <= 9) wxGet(`${base}/weather?v=2&lat=${lat.toFixed(1)}&lon=${lon.toFixed(1)}&tz=${Math.round(place.tz || 9)}`).then(j => { const d = j && (j.days || []).find(x => x.date === iso); if (d) setW({ ...d, kind: "forecast" }); });
  }, [key]);
  if (!w) return null;
  const wear = wearFor(w);
  return (
    <div className="wx-row">
      <div className="row between" style={{ flexWrap: "nowrap", gap: 8 }}>
        {w.kind === "forecast" ? (
          <span className="small" style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <WxIcon sym={w.symbol} />
            <b className="mono">{w.max}° / {w.min}°</b>
            <span className="xs muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.city}{w.rain >= 1 ? ` ・ 雨 ${w.rain}mm` : ""}</span>
          </span>
        ) : (
          // 予報がまだ出ていない日は、予報と見まちがえないように天気のマークを出さず「ふだんは」の書き方にする
          <span className="small muted" style={{ minWidth: 0 }}>{Number(iso.slice(5, 7))}月の{place.city}はふだん <b className="mono" style={{ color: "var(--ink)" }}>{w.max}° / {w.min}°</b>{w.rain >= 1 ? "・雨の多い時期" : ""}</span>
        )}
      </div>
      <div className="wear">
        {wear.keys.map(k => <span key={k} className="wear-chip"><WearIcon k={k} />{WEAR_NAME[k]}</span>)}
      </div>
      {wear.tip && <div className="xs muted" style={{ marginTop: 4 }}>{wear.tip}</div>}
      {/* 予報は MET Norway の決まり（CC BY 4.0）で出所を書く。平年値は書かない */}
      {w.kind === "forecast" ? <div className="xs" style={{ color: "var(--faint)", marginTop: 2 }}>天気：MET Norway</div>
        : <div className="xs" style={{ color: "var(--faint)", marginTop: 2 }}>天気予報は出発の9日前から出ます</div>}
    </div>
  );
}

// ホームの「旅行先の気候」：出発の10日以上前に、泊まる都市ごと（月ごと）の平年の気温と服装の目安を1回ずつ出す
function HomeClimate({ t }) {
  const base = typeof FEATURES !== "undefined" && FEATURES.weatherBase;
  const r = tripRange(t);
  const spots = useMemo(() => {
    if (!base || !r) return [];
    const out = [], seen = new Set();
    for (let d = r.start; d < r.end || d === r.start; d = addDays(d, 1)) {
      const p = wxPlace(t, d);
      if (!p) { if (d >= r.end) break; continue; }
      const k = p.city + "|" + d.slice(5, 7);
      if (!seen.has(k)) { seen.add(k); out.push({ ...p, month: Number(d.slice(5, 7)) }); }
      if (d >= r.end) break;
    }
    return out.slice(0, 4);
  }, [t, base]);
  const [rows, setRows] = useState([]);
  const key = spots.map(x => `${x.city}${x.month}`).join(",");
  useEffect(() => {
    setRows([]);
    if (!spots.length || !r || dayDiff(todayISO(), r.start) <= 9) return;
    Promise.all(spots.map(x => wxGet(`${base}/climate?v=2&lat=${x.ll[0].toFixed(1)}&lon=${x.ll[1].toFixed(1)}`).then(j => { const m = j && (j.months || []).find(y => y.month === x.month); return m ? { ...x, w: { max: m.max, min: m.min, rain: m.rain >= 4 ? 1 : 0, symbol: m.rain >= 4 ? "rain" : "" }, wet: m.rain >= 4 } : null; }))).then(a => setRows(a.filter(Boolean)));
  }, [key]);
  if (!rows.length) return null;
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <h3>旅行先の気候</h3>
      {rows.map(x => { const wear = wearFor(x.w); return (
        <div key={x.city + x.month}>
          <div className="small muted">{x.month}月の{x.city}はふだん <b className="mono" style={{ color: "var(--ink)" }}>{x.w.max}° / {x.w.min}°</b>{x.wet ? "・雨の多い時期" : ""}</div>
          <div className="wear">{wear.keys.map(k => <span key={k} className="wear-chip"><WearIcon k={k} />{WEAR_NAME[k]}</span>)}</div>
          {wear.tip && <div className="xs muted" style={{ marginTop: 4 }}>{wear.tip}</div>}
        </div>
      ); })}
      <div className="xs" style={{ color: "var(--faint)" }}>実際の天気予報は、出発の9日前から旅程の日ごとの画面に出ます</div>
    </section>
  );
}
