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
  if (!open) return <div className="small muted">旅行パス・3か月パスは、2026年12月1日から購入できます。</div>;
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
// 今のプラン（旅行一覧の下に1行、「アカウント」に詳しく）
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
      <span style={{ flex: 1 }}><b>共有ページからリクエストが届いています</b><br /><span className="small muted">押すと「共有」で読めます。読んだら「対応した」か「消す」を押してください。</span></span>
    </button>
  );
}

// 見る専用の共有リンクと、そこから届いたリクエスト（作った人だけ）
// リンクを送るボタン：スマホは共有メニュー（LINE・インスタの DM・メッセージなど）、どこでも LINE とコピー
const canNativeShare = typeof navigator !== "undefined" && !!navigator.share && (navigator.maxTouchPoints > 0 || /Android|iPhone|iPad/.test(navigator.userAgent));
function SendLinkButtons({ url, text, onCopy }) {
  const [shareErr, setShareErr] = useState(false);
  const share = async () => { try { await navigator.share({ title: "Trunk.", text, url }); } catch (e) { if (e && e.name !== "AbortError") setShareErr(true); } };
  const line = "https://line.me/R/share?text=" + encodeURIComponent(text + "\n" + url);
  return (
    <>
      {canNativeShare && !shareErr && <button className="btn primary" onClick={share}>送る（LINE・インスタなど）</button>}
      <a className={"btn" + (canNativeShare && !shareErr ? "" : " primary")} style={{ textDecoration: "none" }} href={line} target="_blank" rel="noopener">LINEで送る</a>
      <button className="btn" onClick={onCopy}>リンクをコピー</button>
    </>
  );
}
function TrunkViewShare({ tripId, name }) {
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
            <SendLinkButtons url={url} text={`「${name || "旅行"}」の旅程です`} onCopy={copy} />
            <a className="btn ghost" href={url} target="_blank" rel="noopener">開いてみる</a>
            <button className="btn" onClick={() => run(() => Store.stopShare(tripId), "stopped")}>共有を止める</button>
          </div>
        </div>
      )}
      {st === "copied" && <div className="small muted">コピーしました。貼り付けて送ってください。</div>}
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
// 招待から参加した人を、精算の参加者にワンタップで足す（名前は Google の表示名）
function TrunkMemberSuggest({ tripId, participants, onAdd }) {
  const [people, setPeople] = useState([]);
  useEffect(() => { let alive = true; Store.people(tripId).then(p => { if (alive) setPeople(p || []); }).catch(() => {}); return () => { alive = false; }; }, [tripId]);
  const names = people.map(p => String(p.display_name || "").trim()).filter(n => n && !participants.includes(n));
  if (!names.length) return null;
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="xs muted">一緒に編集している人を参加者に足す</span>
      <div className="chips">{names.map(n => <button key={n} className="chip" onClick={() => onAdd(n)}><Icon n="plus" s={12} />{n}</button>)}</div>
    </div>
  );
}
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
      {owner ? <TrunkViewShare tripId={tripId} name={t && t.name} /> : <><div className="formsec">見せるだけの共有リンク</div><div className="small muted">共有リンクは、旅行を作った人が出せます。</div></>}
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
            <SendLinkButtons url={url} text={`「${(t && t.name) || "旅行"}」を Trunk. で一緒に計画しよう`} onCopy={copy} />
            <button className="btn ghost" onClick={stop}>このリンクを止める</button>
          </div>
          <div className="xs muted">{until.getMonth() + 1}月{until.getDate()}日まで使えます。知らない人に届いたときは「このリンクを止める」を押してください。</div>
        </div>
      )}
      {st === "copied" && <div className="small muted">コピーしました。貼り付けて送ってください。</div>}
      {st === "copyerr" && <div className="small muted">コピーできませんでした。上のリンクを長押ししてコピーしてください。</div>}
      {st === "stopped" && <div className="small muted">招待リンクを止めました。参加済みの人はそのまま編集できます。</div>}
      {st === "err" && <div className="err">うまくいきませんでした。通信を確かめて、もう一度お試しください。</div>}
    </section>
  );
}

// 機能の要望。名前やメールアドレスは聞かない
// ---- 予約メールの転送取り込み（パスを持っている人だけ） ----
// ===== 予約メールの取り込み（パスの機能） =====
// 届いたメールを1分ごとと画面に戻ったときに読み直し、カード・「予約・手配」の印・ホームの「今やること」で同じものを使う
const inboundWatch = {
  st: { ready: false, paid: false, address: "", items: [], err: "" }, subs: new Set(), started: false,
  async load() {
    try {
      const paid = await Store.canMailImport();
      if (!paid) { this.set({ ready: true, paid: false, address: "", items: [], err: "" }); return; }
      const [address, items] = await Promise.all([this.st.address ? this.st.address : Store.myInboundAddress(), Store.listInbound()]);
      this.set({ ready: true, paid: true, address, items, err: "" });
    } catch (e) { this.set({ ...this.st, ready: true, err: "読み込めませんでした。少し待ってからもう一度お試しください。" }); }
  },
  set(v) { this.st = v; this.subs.forEach(f => f(v)); },
  use() {
    const [v, setV] = useState(this.st);
    useEffect(() => {
      this.subs.add(setV); setV(this.st);
      if (!this.started) {
        this.started = true; this.load();
        setInterval(() => { if (document.visibilityState === "visible") this.load(); }, 60000);
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") this.load(); });
      }
      return () => { this.subs.delete(setV); };
    }, []);
    return v;
  },
};
// メールの日付（チェックイン・出発・体験の日）から、どの旅行の予約かを決める
const inboundDate = (p) => (p && (p.checkin_date || p.depart_date || p.activity_date)) || "";
function inboundTripOf(trips, it) {
  const d = inboundDate(it.parsed);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return (trips || []).find(tr => { const r = tripRange(tr.data || {}); return r && d >= r.start && d <= r.end; }) || null;
}
// この旅行で見せるもの（この旅行の日程に入る予約と、どの旅行にも入らない予約）と、ほかの旅行の予約に分ける
function inboundSplit(items, trips, tripId) {
  const here = [], elsewhere = [];
  items.filter(i => i.kind !== "gmail_confirm").forEach(it => {
    const tr = it.status === "parsed" ? inboundTripOf(trips, it) : null;
    if (tr && tr.id !== tripId) elsewhere.push({ it, trip: tr }); else here.push({ it, trip: tr });
  });
  return { here, elsewhere };
}
// 「予約・手配」の印とホームの「今やること」に足す件数（アプリ本体から呼ぶ）
function useTrunkInbound(trips, tripId) {
  const st = inboundWatch.use();
  if (!st.paid) return 0;
  return inboundSplit(st.items, trips, tripId).here.length + st.items.filter(i => i.kind === "gmail_confirm").length;
}
// 転送先を連絡先に入れておくと、スマホで転送するとき宛先に「Trunk」と打つだけで済む
function vcardHref(address) {
  const v = ["BEGIN:VCARD", "VERSION:3.0", "N:;Trunk 予約メール;;;", "FN:Trunk 予約メール", "EMAIL;TYPE=INTERNET:" + address, "END:VCARD"].join("\r\n");
  return "data:text/vcard;charset=utf-8," + encodeURIComponent(v);
}
function TrunkMailCard({ t, update, toast, trips, tripId, onPick, onCreate, onEdit }) {
  const st = inboundWatch.use();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const load = () => inboundWatch.load();
  const decide = async (id, status) => { try { await Store.setInboundStatus(id, status); } catch (e) {} load(); };
  const apply = (item, p) => { update(p.apply); decide(item.gmailId, "applied"); setDone({ target: p.target, edit: p.edit || null }); toast && toast("旅程に反映しました"); };
  const copy = async () => { try { await navigator.clipboard.writeText(st.address); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {} };
  const makeTrip = async (it) => {
    const p = it.parsed || {}, start = inboundDate(p);
    const place = String(p.city || p.to_place || p.name || "").replace(/[（(].*$/, "").trim();
    const nights = p.checkin_date && p.checkout_date ? Math.max(1, Math.round((Date.parse(p.checkout_date) - Date.parse(p.checkin_date)) / 86400000)) : 1;
    await onCreate({ name: place ? place + "の旅行" : "新しい旅行", start, nights, label: "", people: 1 });
  };
  if (!st.ready) return null;
  if (!st.paid) return (
    <details className="card small" style={{ padding: "10px 14px" }}>
      <summary style={{ cursor: "pointer" }}><b>予約メールを転送して取り込む</b><span className="muted">（パスの機能）</span></summary>
      <div className="stack" style={{ gap: 8, marginTop: 8 }}>
        <p className="muted" style={{ margin: 0 }}>予約の確認メールを転送するだけで、宿や移動を読み取って旅程に反映できます。旅行パス・3か月パスを使っているときに使えます。</p>
        {typeof TrunkBuyPass === "function" && <TrunkBuyPass />}
      </div>
    </details>
  );
  const confirms = st.items.filter(i => i.kind === "gmail_confirm");
  const { here, elsewhere } = inboundSplit(st.items, trips, tripId);
  const otherTrips = [...new Map(elsewhere.map(e => [e.trip.id, e.trip])).values()];
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <div className="row between"><h3>予約メールから取り込む</h3><button className="btn small ghost" disabled={busy} onClick={async () => { setBusy(true); await load(); setBusy(false); }}>更新</button></div>
      <p className="small muted" style={{ margin: 0 }}>予約の確認メールを、このアドレスに転送するだけ。予約サイトでも、ホテルや航空会社からの直接のメールでも、1〜2分で読み取ってここに並びます。</p>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <input className="input mono" readOnly value={st.address} aria-label="転送用のアドレス" onFocus={e => e.target.select()} />
        <button className="btn small" onClick={copy}>{copied ? "コピーしました" : "コピー"}</button>
      </div>
      <div className="row small" style={{ gap: 6, alignItems: "baseline" }}>
        <a href={vcardHref(st.address)} download="trunk-mail.vcf">連絡先に追加</a>
        <span className="xs muted">追加しておくと、転送するとき宛先に「Trunk」と入れるだけで選べます</span>
      </div>
      <details className="small"><summary>よく使う予約サイトは、自動で転送することもできます</summary>
        <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>
          <li>Gmail（パソコン）の 設定 →「すべての設定を表示」→「メール転送と POP/IMAP」→「転送先アドレスを追加」に、上のアドレスを入れる</li>
          <li>1〜2分すると、ここに「Gmail で承認する」が出るので、押して承認する</li>
          <li>Gmail でそのサイトのメールを開き、︙ →「メールの自動振り分け設定」→「フィルタを作成」→「次のアドレスに転送する」で上のアドレスを選ぶ</li>
        </ol>
      </details>
      {confirms.map(c => {
        const code = (c.parsed && c.parsed.code) || "";
        const link = c.parsed && /^https:\/\/mail(-settings)?\.google\.com\/mail\//.test(c.parsed.link || "") ? c.parsed.link : "";
        return (
          <div key={c.id} className="note">
            <b>Gmail から転送の確認が届きました</b>
            <div className="small">{link ? "「Gmail で承認する」を押すと、自動転送が使えるようになります。" : code ? <>確認コード：<b className="mono" style={{ userSelect: "all" }}>{code}</b>（Gmail の画面に入れてください）</> : "確認のリンクを読み取れませんでした。転送先をいったん削除して、もう一度追加してください。"}</div>
            <div className="row" style={{ marginTop: 6 }}>
              {link && <a className="btn small primary" style={{ textDecoration: "none" }} href={link} target="_blank" rel="noopener" onClick={() => setTimeout(() => decide(c.id, "dismissed"), 1500)}>Gmail で承認する</a>}
              <button className="btn small ghost" onClick={() => decide(c.id, "dismissed")}>閉じる</button></div>
          </div>
        );
      })}
      {done && (
        <div className="note row between" style={{ gap: 8 }}>
          <span className="small">反映しました：{done.target}</span>
          <span className="row" style={{ gap: 6 }}>{done.edit && onEdit && <button className="btn small" onClick={() => { const e = done.edit; setDone(null); onEdit(e); }}>開く</button>}<button className="btn small ghost" onClick={() => setDone(null)}>閉じる</button></span>
        </div>
      )}
      {st.err && <div className="err">{st.err}</div>}
      {otherTrips.map(tr => {
        const n = elsewhere.filter(e => e.trip.id === tr.id).length;
        return (
          <div key={tr.id} className="note row between" style={{ gap: 8 }}>
            <span className="small">「{(tr.data && tr.data.name) || "旅行"}」の予約メールが{n}件あります</span>
            <button className="btn small" onClick={() => onPick && onPick(tr.id)}>その旅行を開く</button>
          </div>
        );
      })}
      {here.length === 0 && <p className="xs muted" style={{ margin: 0 }}>この旅行の取り込み待ちのメールはありません。</p>}
      {here.map(({ it, trip }) => it.status === "failed" ? (
        <div key={it.id} className="inboxitem"><b>{it.subject || "（件名なし）"}</b><div className="xs muted">読み取れませんでした。手で入力してください。</div>
          <div className="row"><button className="btn small" onClick={() => decide(it.id, "dismissed")}>閉じる</button></div></div>
      ) : (
        <div key={it.id} className="stack" style={{ gap: 6 }}>
          {!trip && inboundDate(it.parsed) && (
            <div className="note row between" style={{ gap: 8 }}>
              <span className="small">この予約（{inboundDate(it.parsed).slice(5).split("-").map(Number).join("/")}〜）は、どの旅行の日程にも入っていません。</span>
              {onCreate && <button className="btn small" onClick={() => makeTrip(it)}>新しい旅行として作る</button>}
            </div>
          )}
          <InboxItem t={t} onApply={apply} onDecide={decide}
            item={{ gmailId: it.id, subject: it.subject, from: (it.parsed && it.parsed.provider) || it.from_addr, receivedAt: it.received_at, extracted: normalizeBooking(it.parsed) || { ...BOOKING_DEFAULTS, summary: it.subject } }} />
        </div>
      ))}
    </section>
  );
}

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
    const { data } = SB.auth.onAuthStateChange((_e, session) => {
      Store.session = session;
      // Google のボタンでログインしたときはページが読み直されないので、ここで招待を受ける
      const pending = (() => { try { return sessionStorage.getItem("trunk-join"); } catch (e) { return null; } })();
      if (session && pending) {
        try { sessionStorage.removeItem("trunk-join"); } catch (e) {}
        setTimeout(async () => {
          let joinErr = "";
          try { rememberTrip(await Store.acceptInvite(pending)); }
          catch (e) { joinErr = e.code === "members_full" ? "この旅行は参加できる人数（10人）に達しています。" : "招待リンクが使えませんでした。期限が切れたか、止められています。作った人に新しいリンクをもらってください。"; }
          if (alive) setSt(s => ({ ...s, ready: true, session, joinErr, joining: false }));
        }, 0);
        return;
      }
      if (alive) setSt(s => ({ ...s, ready: true, session }));
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  if (!st.ready) return <div className="empty" style={{ paddingTop: 80 }}>読み込み中…</div>;
  if (!st.session) return <LoginView err={st.err} joining={st.joining} />;
  return <>{st.joinErr && <div className="err" style={{ margin: 12 }}>{st.joinErr}</div>}<App /></>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
