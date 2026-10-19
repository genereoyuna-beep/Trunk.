// ================= 共有ページ（見る専用・アカウント不要） =================
// share-build.js が旅行1件分のデータを window.__TRIP__ に埋め込む。編集や Gmail 連携は含まない。
const noop = () => {};
// onSend があるとき（Trunk.）は、リクエストをそのまま作った人のアプリに届ける。ないときは LINE で送る文章を作る
function RequestBox({ t, onSend }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState("");
  if (onSend) {
    const send = async () => { setSent("busy"); try { await onSend(name.trim(), text.trim()); setText(""); setSent("done"); } catch (e) { setSent("err"); } };
    return (
      <section className="card stack" style={{ gap: 10 }}>
        <h3>リクエストを送る</h3>
        <p className="small muted" style={{ margin: 0 }}>行きたい場所、食べたいもの、別行動したい日などを書いて送ってください。この旅程を作った人のアプリに届きます。</p>
        <Field label="お名前"><TextIn value={name} onChange={setName} placeholder="例：ゆうこ" /></Field>
        <Field label="リクエスト"><textarea value={text} maxLength={2000} onChange={e => { setText(e.target.value); if (sent === "done") setSent(""); }} placeholder="例：2日目に九份に行きたい！夜ごはんは小籠包がいいな" /></Field>
        <div className="row"><button className="btn primary" disabled={!text.trim() || sent === "busy"} onClick={send}>{sent === "busy" ? "送っています…" : "送る"}</button></div>
        {sent === "done" && <div className="note">送りました。作った人のアプリに届いています。</div>}
        {sent === "err" && <div className="err">送れませんでした。時間をおいて、もう一度お試しください。</div>}
      </section>
    );
  }
  const msg = `【${t.name} へのリクエスト】${name.trim() ? `（${name.trim()}）` : ""}\n${text.trim()}`;
  const copy = async () => { try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {} };
  return (
    <section className="card stack" style={{ gap: 10 }}>
      <h3>リクエストを送る</h3>
      <p className="small muted" style={{ margin: 0 }}>行きたい場所、食べたいもの、別行動したい日などを書いて、LINEでこのページを送ってくれた人に送ってください。</p>
      <Field label="お名前"><TextIn value={name} onChange={setName} placeholder="例：ゆうこ" /></Field>
      <Field label="リクエスト"><textarea value={text} onChange={e => setText(e.target.value)} placeholder="例：2日目に九份に行きたい！夜ごはんは小籠包がいいな" /></Field>
      <div className="row">
        <a className={"btn primary" + (text.trim() ? "" : " disabled")} aria-disabled={!text.trim()} style={text.trim() ? undefined : { pointerEvents: "none", opacity: .5 }}
          href={`https://line.me/R/share?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">LINEで送る</a>
        <button className="btn" disabled={!text.trim()} onClick={copy}>{copied ? "コピーしました" : "文章をコピー"}</button>
      </div>
      <p className="xs muted" style={{ margin: 0 }}>LINEが開かないときは「文章をコピー」して、LINEやメールに貼り付けて送ってください。</p>
    </section>
  );
}
function ShareHome({ t, goDay }) {
  const r = tripRange(t), today = todayISO();
  if (!r) return <p className="empty card">まだ日程がありません。</p>;
  const traveling = today >= r.start && today <= r.end, before = today < r.start;
  const nextDay = traveling ? today : before ? r.start : null;
  const cost = myShare({ ...t, myName: "" });
  const stays = sortItinerary(staysOf(t)).filter(s => isISO(s.startDate));
  return (
    <div className="stack">
      {nextDay && (
        <section className="card flush divide">
          <div className="row between" style={{ padding: "12px 14px", flexWrap: "nowrap" }}>
            <span style={{ minWidth: 0 }}><span className="mono xs muted">{traveling ? "今日" : "1日目"} ・ {md(nextDay)}（{wdOf(nextDay)}）</span><span style={{ display: "block", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 17 }}>{traveling ? "今日の予定" : "最初の日の流れ"}：{dayEvents(t, nextDay).head}</span></span>
            <button className="btn small" onClick={() => goDay(nextDay)}>日ごとで見る</button>
          </div>
          <div className="share-ro"><DayTimeline t={t} iso={nextDay} onEdit={noop} /></div>
        </section>
      )}
      <section className="card flush divide">
        <div style={{ padding: "12px 14px" }}><h3>日程</h3></div>
        {Array.from({ length: r.days }, (_, i) => addDays(r.start, i)).map((d, i) => {
          const { ev, head } = dayEvents(t, d), first = ev.find(e => e.time);
          return (
            <button key={d} className="bookrow" style={{ gridTemplateColumns: "64px minmax(0,1fr) auto", minHeight: 52, padding: "8px 14px", background: d === today ? "var(--blue-soft)" : undefined }} onClick={() => goDay(d)}>
              <span className="mono"><b style={{ display: "block" }}>{md(d)}</b><span className="xs muted">{i + 1}日目・{wdOf(d)}</span></span>
              <span style={{ minWidth: 0 }}><span className="t1">{head}</span><span className="t2">{ev.length ? `${ev.length}件の予定${first ? `（${first.time.slice(0, 5)} ${first.title}〜）` : ""}` : "予定なし"}</span></span>
              <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><Icon n="down" s={16} /></span>
            </button>
          );
        })}
      </section>
      {stays.length > 0 && (
        <section className="card flush divide">
          <div style={{ padding: "12px 14px" }}><h3>泊まるところ</h3></div>
          {stays.map(s => {
            const h = hotelOf(t, s) || {}, st = stayState(t, s);
            const name = s.noHotel ? (s.lodgingLabel || "宿不要") : h.name || "宿未定";
            return (
              <div key={s.id} className="bookrow" style={{ gridTemplateColumns: "minmax(0,1fr) auto", cursor: "default" }}>
                <span style={{ minWidth: 0 }}>
                  <span className="mono xs muted">{md(s.startDate)}（{wdOf(s.startDate)}）〜{md(stayEnd(s))} ・ {nightsOf(s)}泊 ・ {splitCity(s.city).main}</span>
                  <span className="t1">{name}</span>
                  {(h.checkinTime || h.checkoutTime) && !s.noHotel && <span className="t2">チェックイン {h.checkinTime || "—"} ／ チェックアウト {h.checkoutTime || "—"}</span>}
                  {h.address && !s.noHotel && <a className="xs" href={`https://www.google.com/maps?q=${encodeURIComponent(h.address)}`} target="_blank" rel="noopener noreferrer">{h.address}</a>}
                </span>
                <Pill st={st} />
              </div>
            );
          })}
        </section>
      )}
      {cost.total > 0 && (
        <section className="card">
          <div className="row between"><span className="small muted">1人分の費用の目安</span><span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{yen(cost.total)}</span></div>
          <div className="fgrid small" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", marginTop: 8 }}>
            <div><div className="muted">宿</div><div className="mono">{yen(cost.hotel)}</div></div>
            <div><div className="muted">移動</div><div className="mono">{yen(cost.flight)}</div></div>
            <div><div className="muted">現地</div><div className="mono">{yen(cost.localTransport + cost.localActivity)}</div></div>
          </div>
          <p className="xs muted" style={{ margin: "10px 0 0" }}>それぞれの金額を人数で割った目安です。まだ決まっていない宿や移動、食費・お土産は入っていません。</p>
        </section>
      )}
    </div>
  );
}
function ShareApp({ payload: given, onSend }) {
  const payload = given || window.__TRIP__ || {};
  const t = withBuiltinPhrases(upgradeTrip(payload.data || {}));
  const r = tripRange(t), today = todayISO();
  const [view, setView] = useState("home");
  const [dayIso, setDayIso] = useState(null);
  const goDay = (d) => { setDayIso(d); setView("day"); window.scrollTo(0, 0); };
  const days = r ? dayDiff(today, r.start) : null;
  const stats = tripStats(t);
  return (
    <div className="app" style={{ display: "block" }}>
      <header className="topbar"><span className="tripbtn" style={{ cursor: "default" }}><span>{t.name}</span></span><div className="spacer" /><span className="xs muted" style={{ paddingRight: 4 }}>見る専用</span></header>
      <main className="main" style={{ paddingBottom: 48, margin: "0 auto" }}>
        <div className="stack">
          {view === "home" && <section className="hero">
            {r && days > 0 && <><div className="lbl">出発まで</div><div className="row" style={{ alignItems: "baseline", gap: 6 }}><span className="big">{days}</span><span style={{ fontSize: 16 }}>日</span></div></>}
            {r && days <= 0 && dayDiff(today, r.end) >= 0 && <><div className="lbl">旅行中</div><div className="row" style={{ alignItems: "baseline", gap: 6 }}><span className="big">{1 - days}</span><span style={{ fontSize: 16 }}>日目</span></div></>}
            {r && dayDiff(today, r.end) < 0 && <div style={{ fontSize: 20, fontWeight: 700 }}>旅の記録</div>}
            {r && <div className="route" style={{ gridTemplateColumns: "1fr" }}><div>{r.start.replace(/-/g, ".")}（{wdOf(r.start)}）〜 {r.end.replace(/-/g, ".")}（{wdOf(r.end)}） ・ {r.days}日間 ・ {stats.cities}都市</div></div>}
          </section>}
          <div className="seg" role="tablist" aria-label="表示の切り替え">
            {[["home", "ホーム"], ["day", "日ごと"], ["list", "一覧"], ["month", "月"], ["map", "地図"], ["shiori", "しおり"], ...(Object.keys(t.phrases || {}).length ? [["phrases", "フレーズ"]] : [])].map(([k, l]) => <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}>{l}</button>)}
          </div>
          {view === "home" && <ShareHome t={t} goDay={goDay} />}
          {view === "day" && r && (
            <div className="stack">
              <DayTabs days={Array.from({ length: r.days }, (_, i) => addDays(r.start, i))} sel={dayIso && dayIso >= r.start && dayIso <= r.end ? dayIso : firstDay(r)} setSel={setDayIso} today={today} />
              {Array.from({ length: r.days }, (_, i) => addDays(r.start, i)).filter(d => d === (dayIso && dayIso >= r.start && dayIso <= r.end ? dayIso : firstDay(r))).map((d) => [d, dayDiff(r.start, d)]).map(([d, i]) => (
                <section key={d} id={"day-" + d} className="card flush divide share-ro" style={{ scrollMarginTop: 64, ...(d === today ? { boxShadow: "0 0 0 2px var(--blue)" } : {}) }}>
                  <div style={{ padding: "12px 14px" }}>
                    <span className="mono xs muted">{i + 1}日目 ・ {md(d)}（{wdOf(d)}）{d === today ? " ・ 今日" : ""}</span>
                    <span style={{ display: "block", fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 17 }}>{dayEvents(t, d).head}</span>
                  </div>
                  <DayTimeline t={t} iso={d} onEdit={noop} />
                </section>
              )).concat([<DayMap key="daymap" t={t} iso={dayIso && dayIso >= r.start && dayIso <= r.end ? dayIso : firstDay(r)} />])}
            </div>
          )}
          {view === "list" && <div className="share-ro"><ListView t={t} onEdit={noop} /></div>}
          {view === "month" && <div className="share-ro"><MonthView t={t} onEdit={noop} /></div>}
          {view === "map" && <MapView t={t} />}
          {view === "shiori" && <Shiori t={t} />}
          {view === "phrases" && <PhraseView t={t} onSave={noop} canGenerate={false} />}
          {!r && view !== "home" && <p className="empty card">まだ日程がありません。</p>}
          <RequestBox t={t} onSend={onSend} />
          {typeof FEATURES !== "undefined" && FEATURES.appName === "Trunk." && (
            <section className="card" style={{ textAlign: "center", padding: "18px 16px" }}>
              <div style={{ fontFamily: "var(--f-display)", fontWeight: 900, fontSize: 20 }}>Trunk<span style={{ color: "var(--blue)" }}>.</span></div>
              <p className="small muted" style={{ margin: "6px 0 12px" }}>この旅程は Trunk. で作られています。<br />宿と移動の手配状況、1日の流れ、しおりまでひとつに。</p>
              <a className="btn primary" style={{ textDecoration: "none" }} href="https://trunk-travelplanner.com/?utm_source=share" target="_blank" rel="noopener">自分の旅行も作る（無料）</a>
            </section>
          )}
          <p className="xs muted" style={{ textAlign: "center" }}>最終更新 {payload.updatedAt ? new Date(payload.updatedAt).toLocaleString("ja-JP") : "—"}</p>
        </div>
      </main>
    </div>
  );
}
// Trunk. の共有ページは、データを読み込んでから自分で描く（window.__SHARE_LIVE__）
if (!window.__SHARE_LIVE__) ReactDOM.createRoot(document.getElementById("root")).render(<ShareApp />);
