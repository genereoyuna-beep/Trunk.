// ================= Trunk. だけの画面 =================
// ===== 有料パス =====
const PASS_SALES_START = Date.parse("2026-12-01T00:00:00+09:00");
// 12/1より前に試すとき（Stripe のテスト環境）は、手元（localhost）でアプリを ?passtest=1 で開く
const passTest = location.hostname === "localhost" && (() => { try { if (new URLSearchParams(location.search).get("passtest") === "1") sessionStorage.setItem("trunk-passtest", "1"); return sessionStorage.getItem("trunk-passtest") === "1"; } catch (e) { return false; } })();
const passWatch = {
  subs: new Set(),
  emit() { this.subs.forEach(f => f(Date.now())); },
  use() { const [, set] = useState(0); useEffect(() => { this.subs.add(set); return () => { this.subs.delete(set); }; }, []); return Store.passState; },
};
const fmtDay = (iso) => { const d = new Date(iso); return (d.getMonth() + 1) + "月" + d.getDate() + "日"; };
function TrunkBuyPass() {
  const [st, setSt] = useState("");
  const open = passTest || Date.now() >= PASS_SALES_START;
  const buy = async (kind) => {
    setSt("busy");
    try { await Store.buy(kind); } catch (e) { setSt(e.code === "not_yet" ? "notyet" : "err"); }
  };
  if (!open) return <div className="note">旅行パス・3か月パスは、2026年12月1日から購入できます。それまでは、今の旅行が終わると次の旅行を無料で作れます。</div>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <button className="btn primary block" disabled={st === "busy"} onClick={() => buy("trip")}>旅行パスを買う（1旅行 440円）</button>
      <button className="btn block" disabled={st === "busy"} onClick={() => buy("3m")}>3か月パスを買う（980円）</button>
      <div className="xs muted">支払いは Stripe の画面で行います（クレジットカード）。自動更新はありません。{passTest ? "（テストモード）" : ""}</div>
      {st === "busy" && <div className="small muted">支払いの画面に移動しています…</div>}
      {st === "notyet" && <div className="err">販売は2026年12月1日からです。</div>}
      {st === "err" && <div className="err">支払いの画面を開けませんでした。時間をおいて、もう一度お試しください。</div>}
    </div>
  );
}
// 今のプラン（旅行一覧の下に1行、「共有と設定」に詳しく）
function planSummary(ps) {
  const items = [];
  if (ps.staff) items.push("運営者パス（期限なし）");
  if (ps.until && Date.parse(ps.until) > Date.now()) items.push("3か月パス（" + fmtDay(ps.until) + "まで）");
  if (ps.unusedTrip > 0) items.push("まだ使っていない旅行パス " + ps.unusedTrip + "枚");
  return items;
}
const fmtYmd = (iso) => { const [y, m, d] = iso.split("-"); return y + "年" + Number(m) + "月" + Number(d) + "日"; };
function TrunkPlanLine() {
  const ps = passWatch.use();
  const items = planSummary(ps);
  return <div className="small muted">今のプラン：{items.length ? items.join("・") : "無料（準備中の旅行は1つまで）"}</div>;
}
function TrunkPlanSection() {
  const ps = passWatch.use();
  const items = planSummary(ps);
  const used = (ps.list || []).filter(p => p.kind === "trip" && p.used_at).length;
  return (
    <section className="stack" style={{ gap: 8 }}>
      <div className="formsec">プラン</div>
      <div className="card stack" style={{ gap: 6 }}>
        <b>{items.length ? items.join("・") : "無料"}</b>
        <span className="small muted">
          {items.length ? "パスで準備している旅行は、旅行一覧で「パス」と表示されます。" : "準備中の旅行は1つまで無料です。終わった旅行と、招待されて参加した旅行は数えません。"}
          {used > 0 ? "　これまでに使った旅行パス：" + used + "枚" : ""}
        </span>
        {ps.until && Date.parse(ps.until) > Date.now() && <span className="xs muted">期限が切れても、作った旅行はそのまま使えます。自動更新はありません。</span>}
        {(ps.list || []).filter(p => p.kind !== "staff" && Store.passDeadline(p) >= todayISO()).map(p => <span key={p.id} className="xs muted">{p.kind === "3m" ? "3か月パス" : "旅行パス"}（{fmtDay(p.created_at)}購入）：{fmtYmd(Store.passDeadline(p))}までに出発する旅行に使えます</span>)}
      </div>
    </section>
  );
}

// 支払いから戻ってきたとき・3か月パスの期限が近いときに、ホームに出す
function TrunkPassBanner({ onTrips }) {
  const ps = passWatch.use();
  const [paid, setPaid] = useState(() => { try { return sessionStorage.getItem("trunk-paid") || ""; } catch (e) { return ""; } });
  useEffect(() => {
    if (!paid || paid === "cancel") return;
    // Stripe からの知らせが少し遅れることがあるので、何回か読み直す
    Store.loadPasses(); let n = 0; const iv = setInterval(() => { n++; Store.loadPasses(); if (n >= 20) clearInterval(iv); }, 3000);
    return () => clearInterval(iv);
  }, [paid]);
  const close = () => { try { sessionStorage.removeItem("trunk-paid"); } catch (e) {} setPaid(""); };
  if (paid === "cancel") return <section className="card row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><span className="small">支払いを取りやめました。料金はかかっていません。</span><button className="btn ghost" onClick={close}>閉じる</button></section>;
  if (paid) {
    const ready = paid === "3m" ? !!ps.until : ps.unusedTrip > 0;
    return (
      <section className="card stack" style={{ gap: 8, marginBottom: 14, border: "2px solid var(--blue)" }}>
        <b>{ready ? (paid === "3m" ? "3か月パスが使えるようになりました" : "旅行パスが使えるようになりました") : "お支払いを確かめています…"}</b>
        <span className="small muted">{ready ? (paid === "3m" ? fmtDay(ps.until) + "まで、旅行をいくつでも作れます。" : "「新しい旅行」で作った旅行に、このパスが使われます。") : "少しだけお待ちください。数分たっても変わらないときは、お問い合わせフォームからご連絡ください。"}</span>
        <div className="row" style={{ gap: 8 }}>{ready && <button className="btn primary" onClick={() => { close(); onTrips(); }}>新しい旅行を作る</button>}<button className="btn ghost" onClick={close}>閉じる</button></div>
      </section>
    );
  }
  if (ps.until) {
    const left = Math.ceil((Date.parse(ps.until) - Date.now()) / 86400000);
    if (left <= 7) return <div className="note" style={{ marginBottom: 14 }}>3か月パスは <b>{fmtDay(ps.until)}</b> までです（あと{left}日）。期限後も、作った旅行はそのまま使えます。新しく旅行を作るには、無料の枠かパスが必要になります。</div>;
  }
  return null;
}

// 共有ページから届いた新しいリクエストの数を、30秒ごとと画面に戻ったときに確かめる（作った人の旅行だけ）
const requestWatch = {
  tripId: null, count: 0, subs: new Set(), timer: null,
  async check() {
    const id = this.tripId;
    if (!id || Store.isJoined(id)) { this.set(0); return; }
    try { const n = await Store.newRequestCount(id); if (id === this.tripId) this.set(n); } catch (e) {}
  },
  set(n) { if (n !== this.count) { this.count = n; this.subs.forEach(f => f(n)); } },
  refresh() { this.check(); },
  use(tripId) {
    const [n, setN] = useState(this.tripId === tripId ? this.count : 0);
    useEffect(() => {
      if (this.tripId !== tripId) { this.tripId = tripId; this.count = 0; this.check(); }
      this.subs.add(setN); setN(this.count);
      if (!this.timer) {
        this.timer = setInterval(() => { if (document.visibilityState === "visible") this.check(); }, 30000);
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") this.check(); });
      }
      return () => { this.subs.delete(setN); };
    }, [tripId]);
    return n;
  },
};
function TrunkMenuBadge({ tripId, inline }) {
  const n = requestWatch.use(tripId);
  if (!n) return null;
  return inline
    ? <span style={{ marginLeft: 8, background: "var(--orange-bar)", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{n}</span>
    : <span aria-label={"新しいリクエスト" + n + "件"} style={{ position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "var(--orange-bar)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--f-mono)" }}>{n}</span>;
}
function TrunkRequestsBanner({ tripId, onOpen }) {
  const n = requestWatch.use(tripId);
  if (!n) return null;
  return (
    <button className="card" onClick={onOpen} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, marginBottom: 14, border: "2px solid var(--orange-bar)", cursor: "pointer" }}>
      <span style={{ flex: "none", minWidth: 28, height: 28, borderRadius: 14, background: "var(--orange-bar)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "var(--f-mono)" }}>{n}</span>
      <span style={{ flex: 1 }}><b>共有ページからリクエストが届いています</b><br /><span className="small muted">押すと「共有と設定」で読めます。読んだら「対応した」か「消す」を押してください。</span></span>
    </button>
  );
}

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

// アプリ内のブラウザ（Threads・Instagram・LINE・Facebook など）では、Google がログインを止める。外のブラウザで開いてもらう
const IN_APP = /Barcelona|Instagram|FBAN|FBAV|Line\/|LINE\/|Twitter|TikTok|musical_ly|KAKAOTALK/i.test(navigator.userAgent || "");
if (/Line\//i.test(navigator.userAgent || "") && !/openExternalBrowser=1/.test(location.search)) {
  // LINE はこの印をつけると外のブラウザで開き直してくれる
  const u = new URL(location.href); u.searchParams.set("openExternalBrowser", "1"); location.replace(u.toString());
}
function InAppNotice() {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(location.href.replace(/[?&]openExternalBrowser=1/, "")); setCopied(true); } catch (e) {} };
  return (
    <div className="note" style={{ textAlign: "left" }}>
      <b>アプリの中のブラウザでは、Google でログインできません。</b><br />
      右上のメニュー（… や ⋯）から「ブラウザで開く」を選ぶか、このページのアドレスをコピーして Safari・Chrome で開いてください。
      <div style={{ marginTop: 8 }}><button className="btn small" onClick={copy}>{copied ? "コピーしました" : "アドレスをコピー"}</button></div>
    </div>
  );
}
function LoginView({ err, joining }) {
  const [busy, setBusy] = useState(false);
  const [gErr, setGErr] = useState("");
  const [gsiOk, setGsiOk] = useState(false);
  const btnRef = useRef(null);
  // 予備：今までの方法（Supabase 経由。画面に supabase.co が出る）
  const login = async () => {
    setBusy(true);
    const { error } = await SB.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
    if (error) setBusy(false);
  };
  // Google のボタン（このサイトの名前で表示される）。ID トークンを Supabase に渡してログインする
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await new Promise((ok, ng) => {
          if (window.google && google.accounts && google.accounts.id) return ok();
          const sc = document.createElement("script");
          sc.src = "https://accounts.google.com/gsi/client"; sc.async = true; sc.onload = ok; sc.onerror = ng;
          document.head.appendChild(sc);
        });
        const raw = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))), b => b.toString(16).padStart(2, "0")).join("");
        if (!alive || !btnRef.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID, nonce: hash, ux_mode: "popup", use_fedcm_for_button: true,
          callback: async (res) => {
            setBusy(true); setGErr("");
            const { error } = await SB.auth.signInWithIdToken({ provider: "google", token: res.credential, nonce: raw });
            if (error) { setBusy(false); setGErr("ログインできませんでした。下の「別の方法でログイン」をお試しください。"); }
          },
        });
        btnRef.current.innerHTML = "";
        google.accounts.id.renderButton(btnRef.current, { theme: "filled_black", size: "large", shape: "pill", text: "signin_with", width: Math.min(360, btnRef.current.offsetWidth || 320), locale: "ja" });
        setGsiOk(true);
      } catch (e) { /* 読み込めないときは予備のボタンだけ */ }
    })();
    return () => { alive = false; };
  }, []);
  return (
    <div className="main" style={{ maxWidth: 440, margin: "0 auto", paddingTop: 72 }}>
      <div className="stack" style={{ gap: 18, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--f-display)", fontWeight: 900, fontSize: 34 }}>Trunk<span style={{ color: "var(--blue)" }}>.</span></div>
        <p className="muted">{joining ? <>旅行に招待されています。<br />Google アカウントでログインすると、参加して一緒に編集できます。</> : <>旅の段取りを、一日ずつ。<br />旅行を保存するには、Google アカウントでログインしてください。</>}</p>
        {IN_APP && <InAppNotice />}
        <div ref={btnRef} style={{ display: gsiOk && !busy ? "flex" : "none", justifyContent: "center", minHeight: 44 }} />
        {!gsiOk && <button className="btn primary block" disabled={busy} onClick={login}>{busy ? "Google に移動しています…" : "Google でログイン"}</button>}
        {gsiOk && busy && <p className="small muted">ログインしています…</p>}
        {gsiOk && !busy && gErr && <button className="link xs muted" style={{ background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }} onClick={login}>別の方法でログイン</button>}
        {(err || gErr) && <div className="err">{err || gErr}</div>}
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
      if (q.get("paid")) { try { sessionStorage.setItem("trunk-paid", q.get("paid")); } catch (e) {} }
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
      if (q.has("code") || q.has("error") || q.has("join") || q.has("paid") || q.has("passtest")) history.replaceState(null, "", location.pathname + location.hash);
    })();
    const { data } = SB.auth.onAuthStateChange((_e, session) => { Store.session = session; if (alive) setSt(s => ({ ...s, ready: true, session })); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  if (!st.ready) return <div className="empty" style={{ paddingTop: 80 }}>読み込み中…</div>;
  if (!st.session) return <LoginView err={st.err} joining={st.joining} />;
  return <>{st.joinErr && <div className="err" style={{ margin: 12 }}>{st.joinErr}</div>}<App /></>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
