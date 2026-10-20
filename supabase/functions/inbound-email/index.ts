// 予約メールの転送取り込み。Cloudflare の Email Worker が、届いたメールをここへ送ってくる。
// 宛先の token から持ち主を探し、パスを持っている人だけ受け付けて、AI で予約の内容を読み取る。
// 読み取った結果は inbound_items に「取り込み候補」として残し、本文は3日たったら消す。
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";
import { z } from "npm:zod@4";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@0.135.0/helpers/zod";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SECRET = Deno.env.get("INBOUND_SECRET") ?? "";
const MODEL = Deno.env.get("MAIL_IMPORT_MODEL") ?? "claude-haiku-5-5";
const DAILY_LIMIT = 30;       // 1人1日に受け付ける通数
const BODY_LIMIT = 20000;     // AI に渡す本文の最大文字数（1通から読み取る予約は10件まで）
const KEEP_DAYS = 3;          // 本文を残す日数

// アプリの BOOKING_DEFAULTS と同じ形（アプリ側の normalizeBooking・buildProposal にそのまま渡せる）
const Booking = z.object({
  is_booking: z.boolean(),
  kind: z.enum(["hotel", "transport", "activity", "other"]),
  booking_status: z.enum(["confirmed", "cancelled", "changed", "pending", "unknown"]),
  summary: z.string(), provider: z.string(), name: z.string(), city: z.string(), address: z.string(),
  checkin_date: z.string(), checkout_date: z.string(), checkin_time: z.string(), checkout_time: z.string(),
  guests: z.number(), total_amount: z.number(), currency: z.string(),
  cancel_policy: z.enum(["free_cancel", "changeable", "non_refundable", "unknown"]), cancel_deadline: z.string(),
  paid: z.enum(["paid", "unpaid", "unknown"]), confirmation: z.string(), manage_url: z.string(),
  transport_mode: z.string(), from_place: z.string(), to_place: z.string(),
  depart_date: z.string(), depart_time: z.string(), arrive_date: z.string(), arrive_time: z.string(),
  carrier: z.string(), seat_class: z.string(), activity_date: z.string(), activity_time: z.string(),
});

const Result = z.object({ bookings: z.array(Booking) });

const PROMPT = `あなたは旅行の予約確認メールを読み取るアシスタントです。次のメールが、宿・交通・ツアー・入場券などの「予約」に関するメール（予約確定・変更・キャンセル・支払い完了の通知）かを判定し、決められた形で返してください。
宣伝、ニュースレター、おすすめ、レビュー依頼、仕事の会議室やイベントの予約は is_booking=false にしてください。

ルール:
- 分からない文字列は ""、数値は 0。
- kind: hotel は checkin/checkout、transport は transport_mode と from/to/depart/arrive、activity は activity_date/activity_time を埋める。
- transport_mode: "飛行機" | "鉄道" | "夜行列車" | "フェリー" | "夜行フェリー" | "バス" | "その他" | ""
- 日付は YYYY-MM-DD、時刻は24時間表記の HH:MM。
- city・from_place・to_place は日本語の都市名（例：パリ、ソウル、東京）。空港なら「東京・羽田(HND)」の形。
- total_amount は税・手数料込みの合計、currency は ISO の通貨コード（JPY, EUR など）。
- provider は予約したサイトや会社。summary は日本語の1行要約（例：「プラハ Praha 1のゲストルーム 6/15〜6/19 予約確定」）。
- 転送されたメールの場合は、転送された元のメールの内容を読む。
- 1通に複数の予約が入っているとき（往復の航空券、別々の日の宿、複数のツアーなど）は、bookings に1件ずつ分けて入れる。往復便は行きと帰りで2件。
- 予約に関係ないメールのときは、bookings を空にする。`;

function htmlToText(html: string) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  if (!SECRET || req.headers.get("x-inbound-secret") !== SECRET) return new Response("forbidden", { status: 403 });
  let mail: { to?: string; from?: string; subject?: string; text?: string; html?: string };
  try { mail = await req.json(); } catch { return new Response("bad json", { status: 400 }); }

  // 宛先の token（token@in.trunk-travelplanner.com）から持ち主を探す
  const token = String(mail.to ?? "").toLowerCase().match(/([a-z0-9]{10})@/)?.[1];
  if (!token) return new Response("no token", { status: 200 });
  const { data: addr } = await admin.from("inbound_addresses").select("user_id").eq("token", token).maybeSingle();
  if (!addr) return new Response("unknown address", { status: 200 });
  const userId = addr.user_id as string;

  const { data: paid } = await admin.rpc("has_mail_import", { uid: userId });
  if (!paid) return new Response("not paid", { status: 200 });

  const since = new Date(Date.now() - 864e5).toISOString();
  const { count } = await admin.from("inbound_items").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("received_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return new Response("daily limit", { status: 200 });

  // 古い本文を消す（読み取った結果は残す）
  await admin.from("inbound_items").update({ body: null, body_deleted_at: new Date().toISOString() })
    .eq("user_id", userId).is("body_deleted_at", null).lt("received_at", new Date(Date.now() - KEEP_DAYS * 864e5).toISOString());

  const subject = String(mail.subject ?? "").slice(0, 300);
  const from = String(mail.from ?? "").slice(0, 300);
  const body = (mail.text && mail.text.trim() ? mail.text : htmlToText(mail.html ?? "")).slice(0, BODY_LIMIT);

  // Gmail の自動転送の確認メール：確認コードとリンクだけ取り出す（AI は使わない）
  if (/forwarding-noreply@google\.com/i.test(from)) {
    // 件名の「(#123456789)」が確実。なければ本文から探す
    const hay = `${subject}\n${body}`;
    const code = hay.match(/#\s*([0-9]{6,12})/)?.[1]
      ?? hay.match(/(?:確認コード|Confirmation code)[^0-9]{0,12}([0-9]{6,12})/i)?.[1]
      ?? hay.match(/(?<![0-9])([0-9]{9})(?![0-9])/)?.[1] ?? "";
    const link = body.match(/https:\/\/mail(?:-settings)?\.google\.com\/mail\/[^\s<>"]+/)?.[0] ?? "";
    await admin.from("inbound_items").insert({ user_id: userId, from_addr: from, subject, body, kind: "gmail_confirm", status: "parsed", parsed: { code, link } });
    return new Response("ok", { status: 200 });
  }

  const { data: item, error } = await admin.from("inbound_items").insert({ user_id: userId, from_addr: from, subject, body, status: "pending" }).select("id").single();
  if (error || !item) return new Response("db error", { status: 500 });

  try {
    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "low", format: zodOutputFormat(Result) },
      messages: [{ role: "user", content: `${PROMPT}\n\n--- メール ---\n件名: ${subject}\n差出人: ${from}\n\n${body}` }],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error(res.stop_reason === "refusal" ? "refusal" : "no output");
    // 予約が複数あれば、1件目をこのメールの行に、2件目からは同じメールの別の行として入れる
    const list = (res.parsed_output.bookings || []).filter(b => b.is_booking).slice(0, 10);
    if (!list.length) {
      await admin.from("inbound_items").update({ parsed: (res.parsed_output.bookings || [])[0] ?? null, status: "dismissed" }).eq("id", item.id);
    } else {
      await admin.from("inbound_items").update({ parsed: list[0], status: "parsed", subject: list.length > 1 ? `${subject}（1/${list.length}）` : subject }).eq("id", item.id);
      if (list.length > 1) {
        await admin.from("inbound_items").insert(list.slice(1).map((b, i) => ({ user_id: userId, from_addr: from, subject: `${subject}（${i + 2}/${list.length}）`, parsed: b, status: "parsed", body_deleted_at: new Date().toISOString() })));
      }
    }
  } catch (e) {
    await admin.from("inbound_items").update({ status: "failed", error: (e instanceof Error ? e.message : String(e)).slice(0, 300) }).eq("id", item.id);
  }
  return new Response("ok", { status: 200 });
});
