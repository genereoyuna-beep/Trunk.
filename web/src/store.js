// ================= 保存先（Supabase） =================
// trips 表に旅行1件ずつ。読み書きできるのは作った人と、招待されて参加した同行者だけ（RLS）。
// アプリ本体はアーティファクト版と同じ Store の呼び方をするので、同じ名前の関数をそろえる。
const Store = {
  mode: "supabase", session: null, cache: new Map(), meta: new Map(), inFlight: new Set(), listeners: new Set(),
  async init() {
    const { data } = await SB.auth.getSession();
    this.session = data.session;
  },
  userId() { return this.session && this.session.user ? this.session.user.id : null; },
  isJoined(id) { const m = this.meta.get(id); return !!(m && m.joined); },
  // pass：パスで準備している旅行、joined：招待されて参加した旅行。どちらも無料の枠には数えない
  emit() { const list = [...this.cache].map(([id, data]) => ({ id, data, pass: !!(this.meta.get(id) || {}).pass, joined: this.isJoined(id) })); this.listeners.forEach(f => f(list)); },
  async load() {
    const { data, error } = await SB.from("trips").select("id,data,pass_id,version,owner_id,started_on,planned_end,postponed,updated_at").order("updated_at", { ascending: false });
    if (error) throw error;
    const me = this.userId(), cache = new Map(), meta = new Map();
    data.forEach(r => {
      // 保存中の旅行は、手元の内容と版番号をそのまま使う（保存が終われば揃う）
      if (this.inFlight.has(r.id) && this.cache.has(r.id)) { cache.set(r.id, this.cache.get(r.id)); meta.set(r.id, this.meta.get(r.id)); return; }
      cache.set(r.id, r.data);
      meta.set(r.id, { version: r.version, pass: !!r.pass_id, passId: r.pass_id, joined: r.owner_id !== me, startedOn: r.started_on, plannedEnd: r.planned_end, postponed: r.postponed });
    });
    this.cache = cache; this.meta = meta;
    await this.loadPasses().catch(() => {});
    this.emit();
  },
  watchTrips(cb, onErr) {
    this.listeners.add(cb);
    this.load().catch(e => onErr && onErr(e));
    // 同行者の変更は、画面に戻ってきたときと、開いている間は15秒ごとに取り込む
    const f = () => { if (document.visibilityState === "visible") this.load().catch(() => {}); };
    document.addEventListener("visibilitychange", f);
    const iv = setInterval(f, 15000);
    return () => { this.listeners.delete(cb); document.removeEventListener("visibilitychange", f); clearInterval(iv); };
  },
  // ops：前回の保存からこの端末で加えた変更（関数）。ほかの人の保存と重なったら、最新の内容に重ね直して保存し直す。
  // 重ね直したときは、その内容を返す（アプリが画面に反映する）
  async saveTrip(id, data, ops) {
    this.cache.set(id, data); this.emit();
    this.inFlight.add(id);
    try {
      for (let i = 0; i < 4; i++) {
        const m = this.meta.get(id);
        // 緊急時の情報は旅行の中身に入れない（本人だけの trip_private に保存する）
        const { tripPass, emergency, ...body } = data;
        const { data: v, error } = await SB.rpc("save_trip", { p_id: id, p_name: data.name || "新しい旅行", p_data: body, p_version: m ? m.version : null });
        if (!error) {
          this.meta.set(id, { ...(m || { pass: false, joined: false }), version: v });
          this.cache.set(id, data);
          return data;
        }
        const msg = error.message || "";
        if (/trip_too_large|trip_count_limit/.test(msg)) throw { code: "too_large", msg: /trip_count_limit/.test(msg) ? "旅行は1人300件までです。終わった旅行を整理してください。" : "この旅行は大きすぎて保存できません。写真のような大きなデータを貼り付けていないか確かめてください。" };
        if (/trip_limit/.test(msg)) { this.inFlight.delete(id); await this.load().catch(() => {}); throw { code: "trip_limit" }; }
        if (/gone/.test(msg)) { this.cache.delete(id); this.meta.delete(id); this.emit(); throw { code: "gone" }; }
        if (!/conflict|duplicate key/.test(msg)) throw error;
        // ほかの人が先に保存していた：最新を読み、自分の変更を重ね直す
        const { data: row, error: e2 } = await SB.from("trips").select("data,version,pass_id,owner_id").eq("id", id).single();
        if (e2) throw e2;
        this.meta.set(id, { version: row.version, pass: !!row.pass_id, joined: row.owner_id !== this.userId() });
        if (ops && ops.length) {
          data = ops.reduce((d, f) => { try { return f(d); } catch (e) { return d; } }, upgradeTrip(row.data));
        }
        this.cache.set(id, data);
      }
      throw { code: "conflict" };
    } finally { this.inFlight.delete(id); }
  },
  async deleteTrip(id) {
    const joined = this.isJoined(id);
    this.cache.delete(id); this.meta.delete(id); this.emit();
    // 参加した旅行は消さずに「抜ける」
    const q = joined ? SB.from("trip_members").delete().eq("trip_id", id).eq("user_id", this.userId()) : SB.from("trips").delete().eq("id", id);
    const { error } = await q;
    if (error) throw error;
  },
  // ===== 共同編集 =====
  async people(tripId) {
    const { data, error } = await SB.rpc("trip_people", { p_trip: tripId });
    if (error) throw error;
    return data || [];
  },
  async inviteLink(tripId, fresh) {
    if (!fresh) {
      const { data } = await SB.from("trip_invites").select("token,expires_at").eq("trip_id", tripId).eq("enabled", true).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1);
      if (data && data[0]) return data[0];
    }
    const { data, error } = await SB.from("trip_invites").insert({ trip_id: tripId }).select("token,expires_at").single();
    if (error) throw error;
    return data;
  },
  async stopInvites(tripId) {
    const { error } = await SB.from("trip_invites").update({ enabled: false }).eq("trip_id", tripId);
    if (error) throw error;
  },
  async removeMember(tripId, userId) {
    const { error } = await SB.from("trip_members").delete().eq("trip_id", tripId).eq("user_id", userId);
    if (error) throw error;
  },
  // ===== 緊急時の情報（本人だけが読み書きできる） =====
  async loadPrivate(tripId) {
    const { data, error } = await SB.from("trip_private").select("emergency").eq("trip_id", tripId).eq("user_id", this.userId()).maybeSingle();
    if (error) throw error;
    return data ? data.emergency : null;
  },
  async savePrivate(tripId, emergency) {
    const { error } = await SB.from("trip_private").upsert({ trip_id: tripId, user_id: this.userId(), emergency, updated_at: new Date().toISOString() }, { onConflict: "trip_id,user_id" });
    if (error) throw error;
  },
  // ===== 有料パス =====
  // passState：使っていない旅行パスの数と、3か月パスの期限。旅行一覧と一緒に読み直す
  passState: { unusedTrip: 0, until: null, list: [] },
  async loadPasses() {
    const { data, error } = await SB.from("passes").select("id,kind,valid_until,used_at,created_at").order("created_at", { ascending: false });
    if (error) return;
    const now = Date.now();
    const valid3m = data.filter(p => p.kind === "3m" && p.valid_until && Date.parse(p.valid_until) > now).map(p => p.valid_until).sort();
    const staff = data.some(p => p.kind === "staff" && (!p.valid_until || Date.parse(p.valid_until) > now));
    this.passState = { unusedTrip: data.filter(p => p.kind === "trip" && !p.used_at).length, until: valid3m.length ? valid3m[valid3m.length - 1] : null, staff, list: data };
    passWatch.emit();
  },
  // パスの出発期限（購入から1年、日本時間の日付）
  passDeadline(p) { const d = new Date(Date.parse(p.created_at) + 9 * 3600000); d.setUTCFullYear(d.getUTCFullYear() + 1); return d.toISOString().slice(0, 10); },
  // 保存する前に、保存先の決まり（trips_guard）と同じ考え方で、パスが外れる・新しい旅行として数える変更かを調べる
  checkChange(id, next) {
    const m = this.meta.get(id), prev = this.cache.get(id);
    if (!m || !prev || m.joined) return null;
    const today = todayISO(), r = tripRange(next), o = tripRange(prev);
    const startedOn = m.startedOn || (o && o.start <= today ? o.start : null);
    const plannedEnd = m.plannedEnd || (o ? o.end : null);
    const fmt = (iso) => { const [y, mo, d] = iso.split("-"); return y + "年" + Number(mo) + "月" + Number(d) + "日"; };
    if (startedOn && (!r || r.start > today || (plannedEnd && r.end > addDays(plannedEnd, 30)))) {
      if (!m.postponed && r && r.start > today && today <= addDays(startedOn, 7)) return { kind: "postpone" };
      return { kind: "renew", msg: "始まった旅行の日程を先に動かすと、新しい旅行として数えます。" + (m.pass ? "付いているパスは、ここで使い終わりになります。" : "") + "無料の枠かパスが必要です。延期（出発から7日以内）は1回まで同じ旅行のまま扱えますが、この旅行はもう使ったか、7日を過ぎています。" };
    }
    if (m.passId) {
      const p = (this.passState.list || []).find(x => x.id === m.passId);
      if (p && p.kind !== "staff") {
        const dl = this.passDeadline(p), now = Date.now();
        if ((r && r.start > dl) || (!r && (today > dl || (p.kind === "3m" && Date.parse(p.valid_until) <= now))))
          return { kind: "deadline", msg: "このパスは " + fmt(dl) + " までに出発する旅行に使えます。" + (r ? "出発日がそれより後になるため" : "日付が未定のため") + "、この旅行はパスの対象から外れ、無料の枠かパスが必要になります。" };
      }
    }
    return null;
  },
  canExceed() { const p = this.passState; return p.staff || p.unusedTrip > 0 || (p.until && Date.parse(p.until) > Date.now()); },
  async buy(kind) {
    const { data, error } = await SB.functions.invoke("create-checkout", { body: { kind } });
    if (error || !data || !data.url) {
      let code = "error";
      try { const b = await error.context.json(); code = b.error || code; } catch (e) {}
      throw { code };
    }
    location.href = data.url;
  },
  // ===== 見る専用の共有リンク（作った人だけ） =====
  async share(tripId) {
    const { data } = await SB.from("shares").select("token,enabled").eq("trip_id", tripId).maybeSingle();
    return data || null;
  },
  async startShare(tripId) {
    const cur = await this.share(tripId);
    if (cur) {
      const { data, error } = await SB.from("shares").update({ enabled: true }).eq("trip_id", tripId).select("token,enabled").single();
      if (error) throw error; return data;
    }
    const { data, error } = await SB.from("shares").insert({ trip_id: tripId }).select("token,enabled").single();
    if (error) throw error; return data;
  },
  async stopShare(tripId) {
    const { error } = await SB.from("shares").update({ enabled: false }).eq("trip_id", tripId);
    if (error) throw error;
  },
  async requests(tripId) {
    const { data, error } = await SB.from("share_requests").select("id,name,body,status,created_at").eq("trip_id", tripId).neq("status", "dismissed").order("created_at", { ascending: false }).limit(50);
    if (error) throw error; return data || [];
  },
  // まだ「対応した」「消す」を押していないリクエストの数（作った人だけ数えられる）
  async newRequestCount(tripId) {
    const { count, error } = await SB.from("share_requests").select("id", { count: "exact", head: true }).eq("trip_id", tripId).eq("status", "new");
    if (error) throw error; return count || 0;
  },
  async setRequest(id, status) {
    const { error } = await SB.from("share_requests").update({ status }).eq("id", id);
    if (error) throw error;
    requestWatch.refresh();
  },
  async acceptInvite(token) {
    const { data, error } = await SB.rpc("accept_invite", { p_token: token });
    if (error) throw { code: (/invite_invalid|members_full/.exec(error.message || "") || ["error"])[0] };
    return data;
  },
  // 機能の要望（送るだけ。読むのは運営）
  async sendFeedback(body, whereFrom) {
    const { error } = await SB.from("feedback").insert({ body, where_from: whereFrom });
    if (error) throw error;
  },
  // 予約メールの転送取り込み（パスを持っている人だけ。Gmail を直接読む取り込みは Trunk. では使わない）
  async canMailImport() { const { data } = await SB.rpc("can_mail_import"); return !!data; },
  async myInboundAddress() { const { data, error } = await SB.rpc("my_inbound_address"); if (error) throw error; return `${data}@in.trunk-travelplanner.com`; },
  async listInbound() {
    const { data, error } = await SB.from("inbound_items").select("id, received_at, from_addr, subject, parsed, kind, status, error").in("status", ["parsed", "failed"]).order("received_at", { ascending: false }).limit(50);
    if (error) throw error; return data || [];
  },
  async setInboundStatus(id, status) { const { error } = await SB.from("inbound_items").update({ status }).eq("id", id); if (error) throw error; },
  watchInbox(tripId, cb) { cb([]); return () => {}; },
  async inboxIds() { return new Set(); },
  async setInbox() {}, async updateInbox() {},
  // フレーズ集は旅行データの中（t.phrases）だけを使う
  watchPhrases(tripId, cb) { cb([]); return () => {}; },
  async setPhrase() {},
  async migrateLegacy() { return null; },
  async signOut() { await SB.auth.signOut(); location.reload(); },
};
const rememberTrip = (id) => { try { localStorage.setItem("trunk-current-trip", id); } catch (e) {} };
const recallTrip = () => { try { return localStorage.getItem("trunk-current-trip"); } catch (e) { return null; } };
async function useCap() { return null; }
// ファイルの保存はブラウザのダウンロードで
async function saveFile(filename, data) {
  try {
    const blob = data instanceof Blob ? data : new Blob([data], { type: "application/octet-stream" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return true;
  } catch (e) { return false; }
}
