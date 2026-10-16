// ================= Trunk. だけの画面 =================
// 見る専用の共有リンクと、そこから届いたリクエスト（作った人だけ）
function TrunkViewShare({ tripId }) {
  const [sh, setSh] = useState(undefined);
  const [reqs, setReqs] = useState([]);
  const [st, setSt] = useState("");
  const reload = () => { Store.share(tripId).then(setSh).catch(() => setSh(null)); Store.requests(tripId).then(setReqs).catch(() => {}); };
  useEffect(() => { setSh(undefined); setReqs([]); setSt(""); reload(); }, [tripId]);
  const url = sh && sh.enabled ? location.origin + "/s/?k=" + sh.token : "";
  const run = async (f, ok) => { setSt("busy"); try { await f(); setSt(ok || ""); reload(); } catch (e) { setSt("err"); } };
  const copy = async () => { try { await navigator.clipboard.writeText(url); setSt("copied"); } catch (e) { setSt("copyerr"); } };
  const fmt = (iso) => { const d = new Date(iso); return (d.getMonth() + 1) + "/" + d.getDate(); };
  return (
    <section className="stack" style={{ gap: 10 }}>
      <div className="formsec">見せるだけの共有リンク</div>
      <div className="note">リンクを開いた人は、ログインなしで旅程・しおり・地図を見られます（編集はできません）。緊急時の情報と支出の記録は見えません。いつ開いても最新の旅程です。</div>
      {sh === undefined ? <div className="small muted">読み込み中…</div> : !url ? (
        <button className="btn block" disabled={st === "busy"} onClick={() => run(() => Store.startShare(tripId))}>{sh ? "共有リンクをもう一度使う" : "共有リンクを作る"}</button>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          <div className="mono small" style={{ wordBreak: "break-all", background: "var(--sunk)", borderRadius: 10, padding: "8px 10px" }}>{url}</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={copy}>リンクをコピー</button>
            <a className="btn" href={url} target="_blank" rel="noopener">開いてみる</a>
            <button className="btn" onClick={() => run(() => Store.stopShare(tripId), "stopped")}>共有を止める</button>
          </div>
        </div>
      )}
      {st === "copied" && <div className="small muted">コピーしました。LINE などで送ってください。</div>}
      {st === "copyerr" && <div className="small muted">コピーできませんでした。上のリンクを長押ししてコピーしてください。</div>}
      {st === "stopped" && <div className="small muted">共有を止めました。リンクはすぐに開けなくなります。</div>}
      {st === "err" && <div className="err">うまくいきませんでした。通信を確かめて、もう一度お試しください。</div>}
      {reqs.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="small"><b>共有ページから届いたリクエスト</b></div>
          {reqs.map(q => (
            <div key={q.id} className="card stack" style={{ gap: 6, opacity: q.status === "done" ? .55 : 1 }}>
              <div className="xs muted">{fmt(q.created_at)}　{q.name || "名前なし"}{q.status === "done" ? "　対応済み" : ""}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{q.body}</div>
              <div className="row" style={{ gap: 8 }}>
                {q.status !== "done" && <button className="btn" onClick={() => run(() => Store.setRequest(q.id, "done"))}>対応した</button>}
                <button className="btn ghost" onClick={() => run(() => Store.setRequest(q.id, "dismissed"))}>消す</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// 一緒に編集する人（招待リンク）
function TrunkShareSection({ t, tripId }) {
  const [people, setPeople] = useState(null);
  const [link, setLink] = useState(null);
  const [st, setSt] = useState("");
  const me = Store.userId(), owner = !Store.isJoined(tripId);
  const reload = () => Store.people(tripId).then(setPeople).catch(() => setPeople([]));
  useEffect(() => { setPeople(null); setLink(null); reload(); }, [tripId]);
  const url = link ? location.origin + location.pathname + "?join=" + link.token : "";
  const make = async (fresh) => {
    setSt("busy");
    try { setLink(await Store.inviteLink(tripId, fresh)); setSt(""); } catch (e) { setSt("err"); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setSt("copied"); } catch (e) { setSt("copyerr"); }
  };
  const stop = async () => { try { await Store.stopInvites(tripId); setLink(null); setSt("stopped"); } catch (e) { setSt("err"); } };
  const remove = async (p) => { if (!confirm(p.display_name + " さんをこの旅行から外しますか？")) return; try { await Store.removeMember(tripId, p.user_id); reload(); } catch (e) { setSt("err"); } };
  const until = link ? new Date(link.expires_at) : null;
  return (
    <section className="stack" style={{ gap: 10 }}>
      {owner ? <TrunkViewShare tripId={tripId} /> : <><div className="formsec">見せるだけの共有リンク</div><div className="small muted">共有リンクは、旅行を作った人が出せます。</div></>}
      <div className="formsec">一緒に編集する人</div>
      {people === null ? <div className="small muted">読み込み中…</div> : (
        <div className="stack" style={{ gap: 6 }}>
          {people.map(p => (
            <div key={p.user_id} className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span>{p.display_name}{p.user_id === me ? "（自分）" : ""}{p.is_owner ? <span className="xs muted">　作った人</span> : null}</span>
              {owner && !p.is_owner && <button className="btn ghost" onClick={() => remove(p)}>外す</button>}
            </div>
          ))}
        </div>
      )}
      <div className="note">招待リンクを送ると、相手は Google でログインしてこの旅行に参加し、一緒に編集できます（無料）。持ち物リストは人ごとに分かれます。参加した旅行は、相手の無料の枠には数えません。</div>
      {!link ? <button className="btn block" disabled={st === "busy"} onClick={() => make(false)}>招待リンクを作る</button> : (
        <div className="stack" style={{ gap: 8 }}>
          <div className="mono small" style={{ wordBreak: "break-all", background: "var(--sunk)", borderRadius: 10, padding: "8px 10px" }}>{url}</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={copy}>リンクをコピー</button>
            <button className="btn" onClick={stop}>このリンクを止める</button>
          </div>
          <div className="xs muted">{until.getMonth() + 1}月{until.getDate()}日まで使えます。知らない人に届いたときは「このリンクを止める」を押してください。</div>
        </div>
      )}
      {st === "copied" && <div className="small muted">コピーしました。LINE などで送ってください。</div>}
      {st === "copyerr" && <div className="small muted">コピーできませんでした。上のリンクを長押ししてコピーしてください。</div>}
      {st === "stopped" && <div className="small muted">招待リンクを止めました。参加済みの人はそのまま編集できます。</div>}
      {st === "err" && <div className="err">うまくいきませんでした。通信を確かめて、もう一度お試しください。</div>}
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

function LoginView({ err, joining }) {
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
        <p className="muted">{joining ? <>旅行に招待されています。<br />Google アカウントでログインすると、参加して一緒に編集できます。</> : <>旅の段取りを、一日ずつ。<br />旅行を保存するには、Google アカウントでログインしてください。</>}</p>
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
      // 招待リンク（?join=）：ログインしていなければ、ログイン後に戻ってきたときに受ける
      const join = q.get("join") || (() => { try { return sessionStorage.getItem("trunk-join"); } catch (e) { return null; } })();
      let joinErr = "";
      if (join && !Store.session) { try { sessionStorage.setItem("trunk-join", join); } catch (e) {} }
      if (join && Store.session) {
        try { sessionStorage.removeItem("trunk-join"); } catch (e) {}
        try { rememberTrip(await Store.acceptInvite(join)); }
        catch (e) { joinErr = e.code === "members_full" ? "この旅行は参加できる人数（10人）に達しています。" : "招待リンクが使えませんでした。期限が切れたか、止められています。作った人に新しいリンクをもらってください。"; }
      }
      if (alive) setSt({ ready: true, session: Store.session, err, joinErr, joining: !!join });
      // ログインから戻ってきたときの ?code= を消す
      if (q.has("code") || q.has("error") || q.has("join")) history.replaceState(null, "", location.pathname + location.hash);
    })();
    const { data } = SB.auth.onAuthStateChange((_e, session) => { Store.session = session; if (alive) setSt(s => ({ ...s, ready: true, session })); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  if (!st.ready) return <div className="empty" style={{ paddingTop: 80 }}>読み込み中…</div>;
  if (!st.session) return <LoginView err={st.err} joining={st.joining} />;
  return <>{st.joinErr && <div className="err" style={{ margin: 12 }}>{st.joinErr}</div>}<App /></>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
