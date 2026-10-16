// ================= Trunk. の共有ページ（/s/?k=トークン、見る専用・ログイン不要） =================
// 開くたびに最新の旅程を読み込む。緊急時の情報・支出の記録などは保存先（get_share）の時点で外してある。
function TrunkShareRoot() {
  const token = new URLSearchParams(location.search).get("k") || "";
  const [st, setSt] = useState({ kind: "loading" });
  const load = async () => {
    if (!token) { setSt({ kind: "none" }); return; }
    const { data, error } = await SB.rpc("get_share", { p_token: token });
    if (error) { setSt(s => s.kind === "ok" ? s : { kind: "error" }); return; }
    if (!data) { setSt({ kind: "none" }); return; }
    document.title = (data.data && data.data.name ? data.data.name + " — " : "") + "Trunk.";
    setSt({ kind: "ok", payload: data });
  };
  useEffect(() => {
    load();
    const f = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);
  const send = async (name, body) => {
    const { error } = await SB.rpc("add_share_request", { p_token: token, p_name: name, p_body: body });
    if (error) throw error;
  };
  const box = (msg) => <div className="main" style={{ maxWidth: 440, margin: "0 auto", paddingTop: 80, textAlign: "center" }}><div style={{ fontFamily: "var(--f-display)", fontWeight: 900, fontSize: 28 }}>Trunk<span style={{ color: "var(--blue)" }}>.</span></div><p className="muted" style={{ marginTop: 14 }}>{msg}</p></div>;
  if (st.kind === "loading") return box("読み込み中…");
  if (st.kind === "none") return box("この共有リンクは止められたか、まちがっています。送ってくれた人に確かめてください。");
  if (st.kind === "error") return box("読み込めませんでした。通信を確かめて、もう一度開いてください。");
  return (
    <>
      <ShareApp payload={st.payload} onSend={send} />
      <p className="xs muted" style={{ textAlign: "center", padding: "0 16px 32px" }}><a href="/">Trunk.</a> で作った旅程です</p>
    </>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<TrunkShareRoot />);
