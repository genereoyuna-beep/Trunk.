// ================= 旅のフレーズ集 =================
const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
function speak(text, bcp) {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = bcp; u.rate = 0.9; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
}
// 保存済みと、旅程から分かる言語をあわせた一覧
function phraseLangs(t) {
  const detected = tripLanguages(t), saved = Object.values(t.phrases || {});
  const out = detected.map(l => ({ ...l, saved: (t.phrases || {})[l.lang] || null }));
  saved.forEach(p => { if (!SKIP_LANGS.has(p.lang) && !out.some(o => o.lang === p.lang)) out.push({ lang: p.lang, bcp: p.bcp, countries: p.countries || [], saved: p }); });
  return out;
}
// onSave は「作り始めたときの旅行」に保存する関数（途中で旅行を切り替えても混ざらない）
function PhraseView({ t, onSave, canGenerate, onConsult }) {
  const langs = phraseLangs(t);
  const [cur, setCur] = useState(() => (langs.find(l => l.saved) || langs[0] || {}).lang);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [big, setBig] = useState(null);
  const voice = canSpeak();
  if (!langs.length) return <p className="empty card">この旅行は国内か、行き先の言語が分かりませんでした。滞在先の都市を入れると、その国の言語のフレーズ集を作れます。</p>;
  const L = langs.find(l => l.lang === cur) || langs[0];
  const gen = async (l) => {
    const sample = await useCap("sample");
    if (!sample) { setErr("この表示ではClaudeを呼び出せません"); return; }
    setBusy(l.lang); setErr("");
    try {
      const res = await sample.json(phrasePrompt(l.lang, l.countries), { modelTier: "default" });
      // 番号で一覧のフレーズに当てはめる（日本語と場面はアプリ側の一覧を使う）
      const items = (res && Array.isArray(res.items) ? res.items : []).map(o => { const base = PHRASE_LIST[Number(o && o.id) - 1]; return base && o.local ? { cat: base.cat, ja: base.ja, local: String(o.local), reading: String(o.reading || "") } : null; }).filter(Boolean);
      if (!items.length) setErr("フレーズを作れませんでした。もう一度お試しください");
      else await onSave({ lang: l.lang, bcp: l.bcp, countries: l.countries, items, createdAt: new Date().toISOString() });
    } catch (e) { setErr("フレーズを作れませんでした。もう一度お試しください"); }
    setBusy("");
  };
  const missing = langs.filter(l => !l.saved);
  return (
    <div className="stack">
      <div className="chips">
        {langs.map(l => <button key={l.lang} className="chip" aria-pressed={L.lang === l.lang} onClick={() => setCur(l.lang)}>{l.lang}{!l.saved && <span className="xs" style={{ opacity: .7 }}>（未作成）</span>}</button>)}
      </div>
      {canGenerate && missing.length > 1 && (
        <button className="btn small" disabled={!!busy} onClick={async () => { for (const l of missing) await gen(l); }}>{busy ? `${busy}を作っています…` : `まだの${missing.length}言語をまとめて作る`}</button>
      )}
      {err && <div className="err">{err}</div>}
      <div className="small muted">{L.countries.join("・")}で使う{L.lang}</div>
      {!L.saved ? (
        <section className="card stack" style={{ gap: 10 }}>
          <p style={{ margin: 0 }}>{L.lang}のフレーズ集はまだありません。</p>
          {canGenerate ? <button className="btn primary" disabled={!!busy} onClick={() => gen(L)}>{busy === L.lang ? "作っています…" : `${L.lang}のフレーズ集を作る`}</button>
            : onConsult ? <><p className="small muted" style={{ margin: 0 }}>この言葉は最初から入っていません。あなたの ChatGPT などで作って、取り込めます。</p><button className="btn primary" onClick={onConsult}>AIに相談してフレーズ集を作る</button></>
            : <p className="small muted" style={{ margin: 0 }}>旅行を作った人が作成すると、ここに表示されます。</p>}
        </section>
      ) : (
        <>
          {PHRASE_CATS.map(cat => {
            const items = L.saved.items.filter(i => i.cat === cat);
            if (!items.length) return null;
            return (
              <section key={cat} className="card flush divide">
                <div style={{ padding: "10px 14px" }}><h3>{cat}</h3></div>
                {items.map((p, i) => (
                  <div key={i} className="phrase">
                    <div style={{ minWidth: 0 }}>
                      <div className="xs muted">{p.ja}</div>
                      <div className="phrase-local">{p.local}</div>
                      {p.reading && <div className="small" style={{ color: "var(--blue)" }}>{p.reading}</div>}
                    </div>
                    <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                      {voice && <button className="iconbtn" aria-label={`${p.ja}を読み上げる`} onClick={() => speak(p.local, L.saved.bcp || L.bcp)}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg></button>}
                      <button className="btn small" onClick={() => setBig(p)}>見せる</button>
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
          <div className="row between xs muted"><span>Claudeが作ったフレーズです。発音は目安です。</span>{canGenerate && <button className="btn small ghost" disabled={!!busy} onClick={() => gen(L)}>{busy === L.lang ? "作り直しています…" : "作り直す"}</button>}</div>
        </>
      )}
      {big && (
        <button className="phrase-big" onClick={() => setBig(null)} aria-label="閉じる">
          <span className="phrase-big-local">{big.local}</span>
          {big.reading && <span className="phrase-big-reading">{big.reading}</span>}
          <span className="phrase-big-ja">{big.ja}</span>
          <span className="xs" style={{ color: "#8A929A", marginTop: 24 }}>タップで閉じる</span>
        </button>
      )}
    </div>
  );
}
