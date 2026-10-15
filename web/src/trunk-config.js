// Trunk. 版の設定。AI・Gmail の取り込みは使わない（有料版の後で追加）
const PERSONAL_GMAIL = "";
const FEATURES = { ai: false, mail: false, claudeShare: false, account: true, appName: "Trunk.", freeLimit: 1, phrasesInTrip: true, skipLangs: [], homeAirport: "", newId: () => crypto.randomUUID() };
const SUPABASE_URL = "https://nlstbgnflnchjpnqnelr.supabase.co";
const SUPABASE_KEY = "sb_publishable_bLXkuhZMT1-Dv000H8Fm3g_8-mBaYPY"; // 公開用のキー（ブラウザに置いてよいもの）
const SB = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" } });
