// Trunk. 版の設定。AI・Gmail の取り込みは使わない（有料版の後で追加）
const PERSONAL_GMAIL = "";
const FEATURES = { ai: false, mail: false, claudeShare: false, account: true, appName: "Trunk.", freeLimit: 1, phrasesInTrip: true, skipLangs: [], homeAirport: "", newId: () => crypto.randomUUID() };
const SUPABASE_URL = "https://nlstbgnflnchjpnqnelr.supabase.co";
const SUPABASE_KEY = "sb_publishable_bLXkuhZMT1-Dv000H8Fm3g_8-mBaYPY"; // 公開用のキー（ブラウザに置いてよいもの）
const SB = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" } });
// Google の場所の候補（Places）。ブラウザ用のキーで、使えるサイトを trunk-travelplanner.com に限っている
const MAPS_KEY = "AIzaSyAR_qX5Ags7fGOfQ7Ik9HuSfsmtywLDyiQ";
// 「宿を探す」リンク（A8.net 経由のアゴダ。紹介料が入るので、アプリでは「PR」と表示する）
// アゴダの決まりで、飛び先は都市のページ（パラメータなし）かトップページだけ
const AGODA_CITY = {"東京":"tokyo-jp","大阪":"osaka-jp","京都":"kyoto-jp","札幌":"sapporo-jp","福岡":"fukuoka-jp","那覇":"naha-jp","沖縄":"okinawa-main-island-jp","名古屋":"nagoya-jp","横浜":"yokohama-jp","神戸":"kobe-jp","金沢":"kanazawa-jp","広島":"hiroshima-jp","箱根":"hakone-jp","仙台":"sendai-jp","函館":"hakodate-jp","奈良":"nara-jp","鎌倉":"kamakura-jp","石垣":"ishigaki-jp","ソウル":"seoul-kr","釜山":"busan-kr","済州":"jeju-kr","台北":"taipei-tw","台中":"taichung-tw","台南":"tainan-tw","高雄":"kaohsiung-tw","香港":"hong-kong-hk","マカオ":"macau-mo","上海":"shanghai-cn","北京":"beijing-cn","バンコク":"bangkok-th","チェンマイ":"chiang-mai-th","プーケット":"phuket-th","シンガポール":"singapore-sg","クアラルンプール":"kuala-lumpur-my","ホーチミン":"ho-chi-minh-city-vn","ハノイ":"hanoi-vn","ダナン":"da-nang-vn","セブ":"cebu-ph","マニラ":"manila-ph","バリ":"bali-id","ホノルル":"honolulu-hi-us","グアム":"guam-gu","パリ":"paris-fr","ロンドン":"london-gb","ローマ":"rome-it","ミラノ":"milan-it","フィレンツェ":"florence-it","ヴェネツィア":"venice-it","バルセロナ":"barcelona-es","マドリード":"madrid-es","ベルリン":"berlin-de","ミュンヘン":"munich-de","ウィーン":"vienna-at","プラハ":"prague-cz","ブダペスト":"budapest-hu","アムステルダム":"amsterdam-nl","チューリッヒ":"zurich-ch","ニューヨーク":"new-york-ny-us","ロサンゼルス":"los-angeles-ca-us","サンフランシスコ":"san-francisco-ca-us","ラスベガス":"las-vegas-nv-us","シドニー":"sydney-au","メルボルン":"melbourne-au","大阪市":"osaka-jp","京都市":"kyoto-jp","済州島":"jeju-kr","ホーチミンシティ":"ho-chi-minh-city-vn","ヴェネチア":"venice-it","ベネチア":"venice-it","ニューヨーク市":"new-york-ny-us"};
FEATURES.hotelSearch = (city) => {
  const c = String(city || "").trim();
  const key = Object.keys(AGODA_CITY).find(k => c === k || c.startsWith(k));
  const dest = key ? `https://www.agoda.com/ja-jp/city/${AGODA_CITY[key]}.html` : "https://www.agoda.com/ja-jp/";
  return "https://px.a8.net/svt/ejp?a8mat=4B650I+6CMH2Q+4X1W+BW0YB&a8ejpredirect=" + encodeURIComponent(dest);
};
// 「体験・チケットを探す」リンク（A8.net 経由のアゴダ 遊び・体験。この広告は飛び先を選べないので、決まったリンク）
FEATURES.activitySearch = () => "https://px.a8.net/svt/ejp?a8mat=4BEK9E+BQ4COI+4X1W+TS3OI";
// 「鉄道・バスを探す」リンク（A8.net 経由の Omio。ヨーロッパ内の移動だけに出す。飛び先は選べない）
FEATURES.transportSearch = () => "https://px.a8.net/svt/ejp?a8mat=4BEK9E+DIF60I+4JTS+5YRHE";
