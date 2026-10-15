// ================= AIに相談（利用者自身の ChatGPT・Claude・Gemini を使う） =================
// Trunk. からは AI を呼ばない。相談文を作って利用者の AI を開き、返ってきた答えを貼り付けてもらって取り込む。
// 相談文には、緊急時の情報（パスポート・保険など）や立て替えの明細は入れない。

const CONSULT_AIS = [
  { key: "chatgpt", label: "ChatGPT", url: (q) => `https://chatgpt.com/?q=${q}`, home: "https://chatgpt.com/" },
  { key: "claude", label: "Claude", url: (q) => `https://claude.ai/new?q=${q}`, home: "https://claude.ai/new" },
  { key: "gemini", label: "Gemini", url: null, home: "https://gemini.google.com/app" },
];
const CONSULT_TOPICS = [
  { key: "day", label: "この日の予定", sub: "観光・食事の候補を出してもらい、取り込めます" },
  { key: "trip", label: "旅程全体の見直し", sub: "無理や抜けがないか見てもらう" },
  { key: "pack", label: "持ち物", sub: "足りない物を出してもらい、取り込めます" },
  { key: "free", label: "自由に質問", sub: "聞きたいことを書いて相談" },
  { key: "phrase", label: "フレーズ集を作る", sub: "最初から入っていない言葉のフレーズ集を作って取り込めます" },
];
// 旅行先の言語のうち、まだフレーズ集がないもの（最初から入っている言葉は除く）
const missingPhraseLangs = (t) => tripLanguages(t).filter(l => !(t.phrases || {})[l.lang]);

function consultPrompt(t, topic, iso, wish, lang) {
  if (topic === "phrase") {
    const L = missingPhraseLangs(t).find(l => l.lang === lang) || missingPhraseLangs(t)[0];
    return L ? phrasePrompt(L.lang, L.countries) + "\n\nJSONは ```json のコードブロックで出してください。" : "";
  }
  const head = `私は旅行計画アプリ「Trunk.」で旅程を作っています。下の旅程をもとに相談に乗ってください。\n\n${buildSummaryText(t)}\n\n人数: ${(t.participants || []).length || 1}人\n`;
  const fmt = (shape) => `\n\n説明は日本語で短めにしてください。最後に、アプリに取り込むためのJSONを1つだけ \`\`\`json のコードブロックで出してください。\n形式: ${shape}`;
  if (topic === "day") {
    const { ev, head: where, sleeping } = dayEvents(t, iso);
    return head + `\n## 相談したいこと\n${md(iso)}（${wdOf(iso)}曜日）の過ごし方を提案してください。\n場所: ${where}${sleeping ? `（${splitCity(sleeping.city).main}に宿泊）` : ""}\nすでに決まっている予定: ${ev.length ? ev.map(e => `${e.time || "時刻未定"} ${e.title}`).join(" / ") : "なし"}\n希望: ${wish || "特になし"}\n決まっている予定や移動と時刻が重ならないように、3〜6件を時刻順に。`
      + fmt(`{"date":"${iso}","items":[{"time":"HH:MM","end_time":"HH:MM","title":"予定の名前","category":"観光|食事|買い物|ツアー|入場券|その他体験","address":"場所（施設名や地区名）","price_jpy":1人あたりの費用の目安（円・整数）,"needs_booking":事前予約が必要ならtrue,"note":"ひとこと"}]}`);
  }
  if (topic === "pack") {
    return head + `\n## 相談したいこと\nこの旅行の持ち物で、今のリストに足りない物を挙げてください。行き先の気候・季節・電源プラグなども考えてください。\n希望: ${wish || "特になし"}`
      + fmt(`{"packing":[{"category":"書類|衣類|電子機器|洗面用具|薬|その他","name":"持ち物の名前"}]}`);
  }
  if (topic === "trip") {
    return head + `\n## 相談したいこと\nこの旅程に無理や抜けがないか見てください。移動時間・乗り継ぎ・宿の手配もれ・予算・出発前の手続きなど、気づいた点を優先度の高い順に挙げてください。${wish ? `\n特に見てほしい点: ${wish}` : ""}`;
  }
  return head + `\n## 相談したいこと\n${wish || "（ここに聞きたいことを書いてください）"}`;
}

// 貼り付けられた答えから JSON を取り出す（```json ブロック、なければ最初の { から対応する } まで）
function extractJSON(text) {
  const s = String(text || "");
  const block = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const cands = block ? [block[1]] : [];
  const i = s.indexOf("{");
  if (i >= 0) {
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true; else if (c === "{") depth++; else if (c === "}") { depth--; if (!depth) { cands.push(s.slice(i, j + 1)); break; } }
    }
  }
  for (const c of cands) { try { return JSON.parse(c); } catch (e) {} }
  return null;
}
const HHMM = (v) => /^\d{1,2}:\d{2}$/.test(String(v || "")) ? String(v).padStart(5, "0") : "";

function ConsultView({ t, update, initialTopic, initialIso, done }) {
  const r = tripRange(t);
  const days = r ? Array.from({ length: r.days }, (_, i) => addDays(r.start, i)) : [];
  const [topic, setTopic] = useState(initialTopic || (days.length ? "day" : "trip"));
  const [iso, setIso] = useState(initialIso || firstDay(r) || "");
  const [wish, setWish] = useState("");
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState(null);
  const [msg, setMsg] = useState("");
  const missing = missingPhraseLangs(t);
  const [plang, setPlang] = useState((missing[0] || {}).lang || "");
  const topics = CONSULT_TOPICS.filter(o => o.key !== "phrase" || missing.length);
  const prompt = consultPrompt(t, topic, iso, wish.trim(), plang);
  const canImport = topic === "day" || topic === "pack" || topic === "phrase";
  // claude.ai のアーティファクトのように枠の中で動いているときは、開いたタブにも制限が残って AI のページが表示されない。
  // そのときは開かずに、相談文をコピーして案内だけ出す
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const open = async (ai) => {
    let copied = false;
    try { await navigator.clipboard.writeText(prompt); copied = true; } catch (e) {}
    if (framed) {
      setMsg(copied ? `相談文をコピーしました。ブラウザで ${ai.home.replace(/^https:\/\//, "").replace(/\/$/, "")} を開いて、貼り付けて送ってください。` : "下の「相談文を見る・コピーする」から相談文をコピーして、AIに貼り付けてください。");
      return;
    }
    const q = encodeURIComponent(prompt);
    const url = ai.url && q.length < 7000 ? ai.url(q) : ai.home;
    window.open(url, "_blank", "noopener");
    setMsg(url === ai.home ? `相談文をコピーしました。${ai.label}に貼り付けて送ってください。` : `${ai.label}を開きました。送信ボタンを押してください（相談文はコピーもしてあります）。`);
  };
  const parsed = useMemo(() => {
    if (!answer.trim()) return null;
    const j = extractJSON(answer);
    if (!j) return { err: "答えの中に取り込める形（JSON）が見つかりませんでした。AIに「最後にJSONも出して」と頼んでください。" };
    if (topic === "phrase" && Array.isArray(j.items)) {
      const items = j.items.map(o => { const base = PHRASE_LIST[Number(o && o.id) - 1]; return base && o.local ? { cat: base.cat, ja: base.ja, local: String(o.local), reading: String(o.reading || "") } : null; }).filter(Boolean);
      return items.length ? { kind: "phrase", lang: plang, items, list: [] } : { err: "フレーズを読み取れませんでした。" };
    }
    if (Array.isArray(j.items)) return { kind: "day", date: isISO(j.date) ? j.date : iso, list: j.items.filter(x => x && x.title) };
    if (Array.isArray(j.packing)) return { kind: "pack", list: j.packing.filter(x => x && x.name) };
    return { err: "取り込める項目が見つかりませんでした。" };
  }, [answer, iso, topic, plang]);
  useEffect(() => { setPicked(parsed && parsed.list ? parsed.list.map(() => true) : null); }, [parsed]);
  const importNow = () => {
    if (parsed && parsed.kind === "phrase") {
      const L = missing.find(l => l.lang === parsed.lang) || {};
      update(tr => ({ ...tr, phrases: { ...(tr.phrases || {}), [parsed.lang]: { lang: parsed.lang, bcp: L.bcp || "", countries: L.countries || [], items: parsed.items, createdAt: new Date().toISOString() } } }));
      done(`${parsed.lang}のフレーズ集（${parsed.items.length}件）を取り込みました`);
      return;
    }
    if (!parsed || !parsed.list) return;
    const chosen = parsed.list.filter((_, i) => picked && picked[i]);
    if (!chosen.length) return;
    if (parsed.kind === "day") {
      update(tr => {
        const stay = staysOf(tr).find(s => s.startDate && parsed.date >= s.startDate && parsed.date < stayEnd(s));
        const rows = chosen.map(o => ({ id: uid(), linkedStayId: stay ? stay.id : null, category: LOCAL_CATS.includes(o.category) ? o.category : "観光", desc: String(o.title), address: String(o.address || ""), fromAddress: "", toAddress: "",
          date: parsed.date, startTime: HHMM(o.time), endTime: HHMM(o.end_time), mode: "", price: Math.round(Number(o.price_jpy) || 0), people: 1,
          needsBooking: !!o.needs_booking, memo: [o.note, "（AIに相談）"].filter(Boolean).join(" "), paymentStatus: "未払い", status: "候補" }));
        return { ...tr, localTransport: [...(tr.localTransport || []), ...rows] };
      });
      done(`${chosen.length}件の予定を${md(parsed.date)}に追加しました`);
    } else {
      update(tr => {
        const packing = { ...(tr.packing || {}) };
        chosen.forEach(o => {
          const cat = String(o.category || "その他").slice(0, 20), name = String(o.name).slice(0, 60);
          const list = packing[cat] || [];
          if (!Object.values(packing).flat().some(i => i.name === name)) packing[cat] = [...list, { id: uid(), name, checked: false, bag: "" }];
        });
        return { ...tr, packing };
      });
      done(`${chosen.length}件の持ち物を追加しました`);
    }
  };
  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="small muted" style={{ margin: 0 }}>あなたの ChatGPT・Claude・Gemini に、この旅程を見せて相談できます。Trunk. から AI に直接送ることはなく、パスポートなどの緊急時の情報は相談文に入りません。</p>
      <div className="formsec">何を相談する？</div>
      <div className="card flush divide">
        {topics.map(o => (
          <button key={o.key} className="bookrow" style={{ gridTemplateColumns: "22px minmax(0,1fr)" }} aria-pressed={topic === o.key} onClick={() => { setTopic(o.key); setAnswer(""); }}>
            <span className={"radio" + (topic === o.key ? " on" : "")} aria-hidden="true" />
            <span style={{ minWidth: 0 }}><span className="t1">{o.label}</span><span className="t2">{o.sub}</span></span>
          </button>
        ))}
      </div>
      {topic === "day" && days.length > 0 && <DayTabs days={days} sel={iso} setSel={setIso} today={todayISO()} />}
      {topic === "phrase" && <div className="chips">{missing.map(l => <button key={l.lang} className="chip" aria-pressed={plang === l.lang} onClick={() => { setPlang(l.lang); setAnswer(""); }}>{l.lang}</button>)}</div>}
      {topic !== "phrase" && <Field label={topic === "free" ? "聞きたいこと" : "希望・補足（任意）"}><textarea value={wish} onChange={e => setWish(e.target.value)} placeholder={topic === "free" ? "例：2日目の夜にソウルでおすすめの過ごし方は？" : topic === "day" ? "例：子連れ。歩くのは少なめで、夜は焼肉" : "例：予算を抑えたい"} /></Field>}
      <div className="formsec">AIを選んで開く</div>
      <div className="row">{CONSULT_AIS.map(ai => <button key={ai.key} className="btn" onClick={() => open(ai)}>{ai.label}で相談</button>)}</div>
      {msg && <div className="note">{msg}</div>}
      <details><summary className="small muted">相談文を見る・コピーする</summary><textarea readOnly value={prompt} style={{ minHeight: 160, marginTop: 8, fontSize: 12 }} onFocus={e => e.target.select()} /></details>
      {canImport && <>
        <div className="formsec">答えを取り込む</div>
        <Field label="AIの答えをそのまま貼り付けてください"><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="答えの全文を貼り付け（最後のJSONが読み取られます）" /></Field>
        {parsed && parsed.err && <div className="err">{parsed.err}</div>}
        {parsed && parsed.kind === "phrase" && (
          <>
            <div className="note">{parsed.lang}のフレーズを{parsed.items.length}件読み取りました（例：{parsed.items.slice(0, 2).map(i => `${i.ja} → ${i.local}`).join("、")}）</div>
            <button className="btn primary block" onClick={importNow}>フレーズ集に取り込む</button>
          </>
        )}
        {parsed && parsed.list && parsed.list.length > 0 && picked && (
          <>
            <div className="card flush divide">
              {parsed.list.map((o, i) => (
                <label key={i} className="bookrow" style={{ gridTemplateColumns: "22px minmax(0,1fr)", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!picked[i]} onChange={e => setPicked(picked.map((v, k) => k === i ? e.target.checked : v))} />
                  <span style={{ minWidth: 0 }}>
                    <span className="t1">{parsed.kind === "day" ? `${HHMM(o.time) || "—"} ${o.title}` : o.name}</span>
                    <span className="t2">{parsed.kind === "day" ? [o.category, o.address, Number(o.price_jpy) > 0 && yen(o.price_jpy), o.needs_booking && "要予約", o.note].filter(Boolean).join(" ・ ") : o.category}</span>
                  </span>
                </label>
              ))}
            </div>
            <button className="btn primary block" disabled={!picked.some(Boolean)} onClick={importNow}>{parsed.kind === "day" ? `選んだ予定を${md(parsed.date)}に追加` : "選んだ持ち物を追加"}</button>
          </>
        )}
      </>}
      <p className="xs muted" style={{ margin: 0 }}>AIの答えは目安です。営業時間・料金・予約の要否は、公式サイトで確かめてください。</p>
    </div>
  );
}
