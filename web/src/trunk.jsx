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
