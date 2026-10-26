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
function PhraseView({ t, onSave, canGenerate, onConsult, update }) {
  const langs = phraseLangs(t);
  const [cur, setCur] = useState(() => (langs.find(l => l.saved) || langs[0] || {}).lang);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [big, setBig] = useState(null);
  const [onlyFav, setOnlyFav] = useState(false);
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
  const missing = langs.filter(l => !l.saved || l.saved.customOnly);
  const real = L.saved && !L.saved.customOnly;
  const fav = new Set(t.phraseFav || []);
  const toggleFav = (ja) => update(tr => { const f = new Set(tr.phraseFav || []); f.has(ja) ? f.delete(ja) : f.add(ja); return { ...tr, phraseFav: [...f] }; });
  const removeCustom = (id) => update(tr => ({ ...tr, phraseCustom: (tr.phraseCustom || []).filter(c => c.id !== id) }));
  // ☆だけのときは、☆を付けたものと自分で足したものを出す
  const shown = (L.saved ? L.saved.items : []).filter(i => !onlyFav || i.custom || fav.has(i.ja));
  return (
    <div className="stack">
      <div className="chips">
        {langs.map(l => <button key={l.lang} className="chip" aria-pressed={L.lang === l.lang} onClick={() => setCur(l.lang)}>{l.lang}{(!l.saved || l.saved.customOnly) && <span className="xs" style={{ opacity: .7 }}>（未作成）</span>}</button>)}
      </div>
      {canGenerate && missing.length > 1 && (
        <button className="btn small" disabled={!!busy} onClick={async () => { for (const l of missing) await gen(l); }}>{busy ? `${busy}を作っています…` : `まだの${missing.length}言語をまとめて作る`}</button>
      )}
      {err && <div className="err">{err}</div>}
      <div className="small muted">{L.countries.join("・")}で使う{L.lang}</div>
      {!real && (
        <section className="card stack" style={{ gap: 10 }}>
          <p style={{ margin: 0 }}>{L.lang}のフレーズ集はまだありません。</p>
          {canGenerate ? <button className="btn primary" disabled={!!busy} onClick={() => gen(L)}>{busy === L.lang ? "作っています…" : `${L.lang}のフレーズ集を作る`}</button>
            : onConsult ? <><p className="small muted" style={{ margin: 0 }}>この言葉は最初から入っていません。あなたの ChatGPT などで作って、取り込めます。下の「フレーズを足す」から、1つずつ入れることもできます。</p><button className="btn primary" onClick={onConsult}>AIに相談してフレーズ集を作る</button></>
            : <p className="small muted" style={{ margin: 0 }}>旅行を作った人が作成すると、ここに表示されます。</p>}
        </section>
      )}
      {L.saved && (
        <>
          {(update || fav.size > 0) && (
            <div className="chips">
              <button className="chip" aria-pressed={!onlyFav} onClick={() => setOnlyFav(false)}>すべて</button>
              <button className="chip" aria-pressed={onlyFav} onClick={() => setOnlyFav(true)}>☆を付けたもの <b>{L.saved.items.filter(i => i.custom || fav.has(i.ja)).length}</b></button>
            </div>
          )}
          {onlyFav && !shown.length && <p className="empty card">まだありません。よく使いそうなフレーズの☆を押すと、ここに集まります。</p>}
          {[PHRASE_CUSTOM_CAT, ...PHRASE_CATS].map(cat => {
            const items = shown.filter(i => i.cat === cat);
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
                      {update && (p.custom
                        ? <button className="iconbtn" aria-label={`${p.ja}を消す`} onClick={() => removeCustom(p.custom)}><Icon n="x" s={16} /></button>
                        : <button className={"iconbtn phrase-star" + (fav.has(p.ja) ? " on" : "")} aria-pressed={fav.has(p.ja)} aria-label={`${p.ja}に☆を付ける`} onClick={() => toggleFav(p.ja)}>{fav.has(p.ja) ? "★" : "☆"}</button>)}
                      {voice && <button className="iconbtn" aria-label={`${p.ja}を読み上げる`} onClick={() => speak(p.local, L.saved.bcp || L.bcp)}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg></button>}
                      <button className="btn small" onClick={() => setBig(p)}>見せる</button>
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
          {real && <div className="row between xs muted"><span>Claudeが作ったフレーズです。発音は目安です。</span>{canGenerate && <button className="btn small ghost" disabled={!!busy} onClick={() => gen(L)}>{busy === L.lang ? "作り直しています…" : "作り直す"}</button>}</div>}
        </>
      )}
      {update && <PhraseAdd L={L} update={update} />}
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

// 自分でフレーズを足す。訳は Google 翻訳で調べて貼ってもらう（アプリの中では AI を使わない）
function PhraseAdd({ L, update }) {
  const [ja, setJa] = useState(""), [local, setLocal] = useState(""), [reading, setReading] = useState("");
  const tl = /^zh-(TW|HK)/.test(L.bcp || "") ? "zh-TW" : /^zh/.test(L.bcp || "") ? "zh-CN" : String(L.bcp || "").split("-")[0];
  const add = () => {
    const j = ja.trim(), l = local.trim(); if (!j || !l) return;
    update(tr => ({ ...tr, phraseCustom: [...(tr.phraseCustom || []).filter(c => !(c.lang === L.lang && c.ja === j)), { id: String(uid()), lang: L.lang, ja: j, local: l, reading: reading.trim() }] }));
    setJa(""); setLocal(""); setReading("");
  };
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <h3>フレーズを足す（{L.lang}）</h3>
      <input className="input" aria-label="日本語" placeholder="日本語（例：辛さ控えめでお願いします）" value={ja} onChange={e => setJa(e.target.value)} />
      {ja.trim() && tl && <a className="small" href={`https://translate.google.com/?sl=ja&tl=${tl}&text=${encodeURIComponent(ja.trim())}&op=translate`} target="_blank" rel="noopener">Google 翻訳で「{ja.trim().slice(0, 16)}」の訳を調べる</a>}
      <input className="input" aria-label={L.lang} placeholder={`${L.lang}（訳を貼る）`} value={local} onChange={e => setLocal(e.target.value)} />
      <input className="input" aria-label="読み方" placeholder="読み方（任意。カタカナで）" value={reading} onChange={e => setReading(e.target.value)} />
      <button className="btn primary" disabled={!ja.trim() || !local.trim()} onClick={add}>追加する</button>
    </section>
  );
}
