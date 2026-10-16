// 有料パスの支払いページ（Stripe Checkout）を作る。ログインした人だけ呼べる。
// 本番の鍵（sk_live_ / rk_live_）では 2026-12-01 より前は売らない。テストの鍵では手元（localhost）から試せる。
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// 鍵がまだ入っていなくても起動できるよう、使うときに作る
const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripe = key ? new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }) : null;
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SALES_START = Date.parse("2026-12-01T00:00:00+09:00");
const ORIGINS = ["https://trunk-travelplanner.com", "http://localhost:5173"];
const PLANS: Record<string, { name: string; amount: number; description: string }> = {
  trip: { name: "Trunk. 旅行パス", amount: 440, description: "無料の1つとは別に、旅行を1つ準備できます。その旅行が終わるまで使えます。自動更新なし。" },
  "3m": { name: "Trunk. 3か月パス", amount: 980, description: "3か月間、旅行をいくつでも準備できます。期限後も作った旅行は使えます。自動更新なし。" },
};

function cors(origin: string | null) {
  const o = origin && ORIGINS.includes(origin) ? origin : ORIGINS[0];
  return { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
const json = (body: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const h = cors(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "method" }, 405, h);

  if (!stripe) return json({ error: "not_configured" }, 503, h);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return json({ error: "login_required" }, 401, h);

  const { kind } = await req.json().catch(() => ({}));
  const plan = PLANS[kind];
  if (!plan) return json({ error: "bad_kind" }, 400, h);

  // 本番の鍵は sk_live_（標準）か rk_live_（権限を絞った鍵）で始まる
  const live = /^(sk|rk)_live_/.test(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
  if (live && Date.now() < SALES_START) return json({ error: "not_yet" }, 403, h);
  // テストの鍵のときは、手元の確認用（localhost）からだけ買える。本番のサイトからテストのカードでパスを取られないように
  if (!live && origin !== "http://localhost:5173") return json({ error: "not_yet" }, 403, h);

  // 公開記念コードなどの割引は、1人1回まで（すでに割引で買っていれば、コード欄を出さない）
  const { count } = await admin.from("passes").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("promo_code", "is", null);

  const base = origin && ORIGINS.includes(origin) ? origin : ORIGINS[0];
  const session = await stripe!.checkout.sessions.create({
    mode: "payment",
    locale: "ja",
    line_items: [{ quantity: 1, price_data: { currency: "jpy", unit_amount: plan.amount, product_data: { name: plan.name, description: plan.description } } }],
    allow_promotion_codes: !count,
    client_reference_id: user.id,
    metadata: { user_id: user.id, kind },
    customer_email: user.email ?? undefined,
    success_url: `${base}/app/?paid=${kind}`,
    cancel_url: `${base}/app/?paid=cancel`,
  });
  return json({ url: session.url }, 200, h);
});
