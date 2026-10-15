// ================= 保存先（Supabase） =================
// trips 表に旅行1件ずつ。読み書きできるのは本人だけ（RLS）。
// アプリ本体はアーティファクト版と同じ Store の呼び方をするので、同じ名前の関数をそろえる。
const Store = {
  mode: "supabase", session: null, cache: new Map(), listeners: new Set(),
  async init() {
    const { data } = await SB.auth.getSession();
    this.session = data.session;
  },
  emit() { const list = [...this.cache].map(([id, data]) => ({ id, data })); this.listeners.forEach(f => f(list)); },
  async load() {
    const { data, error } = await SB.from("trips").select("id,data,updated_at").order("updated_at", { ascending: false });
    if (error) throw error;
    this.cache = new Map(data.map(r => [r.id, r.data]));
    this.emit();
  },
  watchTrips(cb, onErr) {
    this.listeners.add(cb);
    this.load().catch(e => onErr && onErr(e));
    // ほかの端末での変更は、画面に戻ってきたときに取り込む
    const f = () => { if (document.visibilityState === "visible") this.load().catch(() => {}); };
    document.addEventListener("visibilitychange", f);
    return () => { this.listeners.delete(cb); document.removeEventListener("visibilitychange", f); };
  },
  async saveTrip(id, data) {
    const r = tripRange(data);
    this.cache.set(id, data); this.emit();
    const { error } = await SB.from("trips").upsert({ id, name: data.name || "新しい旅行", start_date: r ? r.start : null, end_date: r ? r.end : null, data });
    if (error) throw error;
  },
  async deleteTrip(id) {
    this.cache.delete(id); this.emit();
    const { error } = await SB.from("trips").delete().eq("id", id);
    if (error) throw error;
  },
  // 予約メールの取り込みは Trunk. ではまだ使わない
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
