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

// ---- 通貨 ----
function CurrencyCard({ t, update }) {
  const curs = tripCurrencies(t);
  const [cur, setCur] = useState(curs[0] || "EUR");
  const [amt, setAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
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
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <div className="row between"><h3>通貨の換算</h3>{FEATURES.ai && <button className="btn small" disabled={busy} onClick={guess}>{busy ? "調べています…" : "Claudeで目安のレートを入れる"}</button>}</div>
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
function ExpenseView({ t, update }) {
  const people = t.participants || [];
  const curs = ["JPY", ...tripCurrencies(t)];
  const r = tripRange(t), today = todayISO();
  const defDate = r && today >= r.start && today <= r.end ? today : r ? r.start : today;
  const blank = () => ({ date: defDate, title: "", amount: "", currency: curs[1] || "JPY", payer: t.myName || people[0] || "", split: [...people], category: "食事" });
  const [f, setF] = useState(blank);
  const list = [...(t.expenses || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const total = list.reduce((a, e) => a + toJPY(t, e.amount, e.currency), 0);
  const noRate = uniq(list.filter(e => !hasRate(t, e.currency)).map(e => e.currency));
  const add = () => {
    if (!String(f.title).trim() || !(Number(f.amount) > 0)) return;
    update(tr => ({ ...tr, expenses: [...(tr.expenses || []), { id: uid(), ...f, title: f.title.trim(), amount: Number(f.amount) }] }));
    setF({ ...blank(), date: f.date, currency: f.currency, payer: f.payer });
  };
  const byCat = EXP_CATS.map(c => [c, list.filter(e => e.category === c).reduce((a, e) => a + toJPY(t, e.amount, e.currency), 0)]).filter(([, v]) => v > 0);
  return (
    <div className="stack">
      <section className="card stack" style={{ gap: 10 }}>
        <h3>支出を記録</h3>
        <div className="fgrid">
          <Field label="内容" wide><TextIn value={f.title} onChange={v => setF({ ...f, title: v })} placeholder="例：ランチ、地下鉄、お土産" /></Field>
          <Field label="金額"><input type="number" inputMode="decimal" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="通貨"><select value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>{curs.map(c => <option key={c} value={c}>{c}（{CUR_NAME[c] || c}）</option>)}</select></Field>
          <Field label="日付"><DateIn value={f.date} onChange={v => setF({ ...f, date: v })} /></Field>
          <Field label="種類"><select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{EXP_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
          {people.length > 0 && <Field label="払った人"><select value={f.payer} onChange={e => setF({ ...f, payer: e.target.value })}>{people.map(p => <option key={p}>{p}</option>)}</select></Field>}
        </div>
        {people.length > 1 && (
          <div className="stack" style={{ gap: 6 }}>
            <span className="small muted">誰の分か（割り勘する人）</span>
            <div className="chips">{people.map(p => <button key={p} className="chip" aria-pressed={f.split.includes(p)} onClick={() => setF({ ...f, split: f.split.includes(p) ? f.split.filter(x => x !== p) : [...f.split, p] })}>{p}</button>)}</div>
          </div>
        )}
        {f.amount && f.currency !== "JPY" && <div className="small muted mono">{hasRate(t, f.currency) ? `≒ ${yen(toJPY(t, f.amount, f.currency))}` : "この通貨のレートが未入力です（下の「通貨の換算」で入れられます）"}</div>}
        <button className="btn primary" disabled={!f.title.trim() || !(Number(f.amount) > 0)} onClick={add}>記録する</button>
        {people.length === 0 && <div className="xs muted">「精算」で参加者を登録すると、払った人と割り勘の相手を選べます。</div>}
      </section>
      <section className="card stack" style={{ gap: 8 }}>
        <div className="row between"><h3>これまでの支出</h3><span className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{yen(total)}</span></div>
        {byCat.length > 0 && <div className="xs muted">{byCat.map(([c, v]) => `${c} ${yen(v)}`).join(" ・ ")}</div>}
        {noRate.length > 0 && <div className="xs" style={{ color: "var(--orange)" }}>{noRate.join("・")}のレートが未入力のため、合計に入っていません</div>}
        {!list.length && <p className="empty">まだ記録がありません。</p>}
        <div className="divide">
          {list.map(e => (
            <div key={e.id} className="row between" style={{ flexWrap: "nowrap", padding: "8px 0" }}>
              <span style={{ minWidth: 0 }}><span className="t1">{e.title}</span><span className="xs muted">{md(e.date)} ・ {e.category}{e.payer ? ` ・ ${e.payer}が払った` : ""}{e.split && e.split.length && people.length > 1 && e.split.length < people.length ? `（${e.split.join("・")}の分）` : ""}</span></span>
              <span className="row" style={{ flexWrap: "nowrap", gap: 4 }}>
                <span style={{ textAlign: "right" }}><span className="mono" style={{ display: "block" }}>{e.currency === "JPY" ? yen(e.amount) : `${Number(e.amount).toLocaleString("ja-JP")} ${e.currency}`}</span>{e.currency !== "JPY" && hasRate(t, e.currency) && <span className="xs muted mono">≒ {yen(toJPY(t, e.amount, e.currency))}</span>}</span>
                <button className="iconbtn" aria-label={`${e.title}を削除`} onClick={() => update(tr => ({ ...tr, expenses: tr.expenses.filter(x => x.id !== e.id) }))}><Icon n="x" s={16} /></button>
              </span>
            </div>
          ))}
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
          {!(t.emergencyCountries || []).length && <p className="empty">{canEdit && FEATURES.ai ? "「Claudeに調べてもらう」で、警察・救急の番号と日本大使館の連絡先をまとめます。" : <>警察・救急の番号と日本大使館の連絡先は、外務省の<a href="https://www.anzen.mofa.go.jp/" target="_blank" rel="noopener noreferrer">海外安全ホームページ</a>で確かめられます。</>}</p>}
          {(t.emergencyCountries || []).length > 0 && <div className="xs muted">番号はClaudeの知識にもとづく目安です。外務省の海外安全ホームページ等で確認してください。</div>}
        </section>
      )}
    </div>
  );
}
// 帰国日から6か月未満か
function r6(t, exp) { const r = tripRange(t); return r && isISO(exp) && dayDiff(r.end, exp) < 183; }
