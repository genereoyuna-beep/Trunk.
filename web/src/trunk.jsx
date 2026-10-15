// ================= Trunk. だけの画面 =================
// 共有リンク（フェーズ2で作る）
function TrunkShareSection({ t, tripId }) {
  return (
    <section className="stack" style={{ gap: 10 }}>
      <div className="formsec">共有リンク（見る専用・アカウント不要）</div>
      <div className="note">共有リンクは準備中です（11月1日の公開までに使えるようになります）。</div>
    </section>
  );
}

// 機能の要望。名前やメールアドレスは聞かない
function FeedbackForm({ whereFrom, placeholder, onDone }) {
  const [body, setBody] = useState("");
  const [st, setSt] = useState("");
  const send = async () => {
    setSt("busy");
    try { await Store.sendFeedback(body.trim(), whereFrom); setBody(""); setSt("done"); onDone && onDone(); }
    catch (e) { setSt("err"); }
  };
  if (st === "done") return <div className="note">ありがとうございます。届きました。いただいた声は、次に作る機能を決めるときに読んでいます。</div>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <textarea value={body} maxLength={2000} rows={3} onChange={e => setBody(e.target.value)} placeholder={placeholder} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span className="xs muted">名前やメールアドレスは送られません</span>
        <button className="btn primary" disabled={!body.trim() || st === "busy"} onClick={send}>{st === "busy" ? "送っています…" : "送る"}</button>
      </div>
      {st === "err" && <div className="err">送れませんでした。通信を確かめて、もう一度お試しください。</div>}
    </div>
  );
}
function TrunkFeedbackSection() {
  return (
    <section className="stack" style={{ gap: 10 }}>
      <div className="formsec">ほしい機能・困ったこと</div>
      <FeedbackForm whereFrom="settings" placeholder="例：持ち物を前の旅行からコピーしたい" />
    </section>
  );
}
// 旅行が終わってから2週間、ホームに1回だけ出す。閉じたらその旅行では二度と出さない
function TrunkAfterTrip({ t, tripId }) {
  const key = "trunk-after-trip-" + tripId;
  const seen = () => { try { return !!localStorage.getItem(key); } catch (e) { return false; } };
  const [hidden, setHidden] = useState(seen);
  useEffect(() => setHidden(seen()), [tripId]);
  const r = tripRange(t);
  if (hidden || !r) return null;
  const since = dayDiff(r.end, todayISO());
  if (since < 1 || since > 14) return null;
  const close = () => { try { localStorage.setItem(key, "1"); } catch (e) {} setHidden(true); };
  return (
    <section className="card stack" style={{ gap: 10, marginBottom: 14 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <b>おかえりなさい。この旅で不便だったことは？</b>
        <button className="btn ghost" aria-label="閉じる" onClick={close}>閉じる</button>
      </div>
      <FeedbackForm whereFrom="after_trip" placeholder="例：旅行中に地図をすぐ開きたかった" onDone={() => { try { localStorage.setItem(key, "1"); } catch (e) {} }} />
    </section>
  );
}

function LoginView({ err }) {
  const [busy, setBusy] = useState(false);
  const login = async () => {
    setBusy(true);
    const { error } = await SB.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
    if (error) setBusy(false);
  };
  return (
    <div className="main" style={{ maxWidth: 440, margin: "0 auto", paddingTop: 72 }}>
      <div className="stack" style={{ gap: 18, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--f-display)", fontWeight: 900, fontSize: 34 }}>Trunk<span style={{ color: "var(--blue)" }}>.</span></div>
        <p className="muted">旅の段取りを、一日ずつ。<br />旅行を保存するには、Google アカウントでログインしてください。</p>
        <button className="btn primary block" disabled={busy} onClick={login}>{busy ? "Google に移動しています…" : "Google でログイン"}</button>
        {err && <div className="err">{err}</div>}
        <p className="xs muted">ログインすると <a href="/privacy.html">プライバシーポリシー</a> に同意したものとみなします。</p>
      </div>
    </div>
  );
}

function Root() {
  const [st, setSt] = useState({ ready: false, session: null, err: "" });
  useEffect(() => {
    let alive = true;
    (async () => {
      const q = new URLSearchParams(location.search);
      const err = q.get("error_description") || "";
      await Store.init().catch(() => {});
      if (alive) setSt({ ready: true, session: Store.session, err });
      // ログインから戻ってきたときの ?code= を消す
      if (q.has("code") || q.has("error")) history.replaceState(null, "", location.pathname + location.hash);
    })();
    const { data } = SB.auth.onAuthStateChange((_e, session) => { Store.session = session; if (alive) setSt(s => ({ ...s, ready: true, session })); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  if (!st.ready) return <div className="empty" style={{ paddingTop: 80 }}>読み込み中…</div>;
  if (!st.session) return <LoginView err={st.err} />;
  return <App />;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
