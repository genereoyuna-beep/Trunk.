// Stripe からの知らせ（支払い完了）を受けて、パスを付ける。Stripe の署名を確かめてから書き込む。
import Stripe from "npm:stripe@17.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { httpClient: Stripe.createFetchHttpClient() });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const crypto = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig ?? "", Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "", undefined, crypto);
  } catch (_e) {
    return new Response("bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = await stripe.checkout.sessions.retrieve((event.data.object as Stripe.Checkout.Session).id, { expand: ["discounts.promotion_code"] });
    if (s.payment_status !== "paid") return new Response("not paid", { status: 200 });
    const userId = s.metadata?.user_id, kind = s.metadata?.kind;
    if (!userId || (kind !== "trip" && kind !== "3m")) return new Response("ignored", { status: 200 });
    const promo = (s.discounts ?? []).map((d) => typeof d.promotion_code === "object" && d.promotion_code ? d.promotion_code.code : null).find(Boolean) ?? null;
    let validUntil: string | null = null;
    if (kind === "3m") { const d = new Date(); d.setMonth(d.getMonth() + 3); validUntil = d.toISOString(); }
    const { error } = await admin.from("passes").upsert(
      { user_id: userId, kind, valid_until: validUntil, stripe_session: s.id, promo_code: promo, amount: s.amount_total },
      { onConflict: "stripe_session", ignoreDuplicates: true },
    );
    if (error) return new Response("db error", { status: 500 }); // Stripe がもう一度送ってくる
  }
  return new Response("ok", { status: 200 });
});
