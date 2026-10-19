// 届いたメールを読み解いて（件名・差出人・本文）、Supabase の inbound-email に送る。
// 大きすぎるメール・添付ファイルは送らない。うまく送れなかったときは送り主に戻さず、黙って捨てる（迷惑メール対策）。
import PostalMime from "postal-mime";

const MAX_RAW = 2 * 1024 * 1024; // 2MB を超えるメールは受け付けない

export default {
  async email(message, env) {
    if (message.rawSize > MAX_RAW) return;
    const raw = await new Response(message.raw).arrayBuffer();
    const mail = await PostalMime.parse(raw);
    const body = {
      to: message.to,
      from: message.from,
      subject: mail.subject || "",
      text: (mail.text || "").slice(0, 100000),
      html: mail.text ? "" : (mail.html || "").slice(0, 200000),
    };
    await fetch(env.INBOUND_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-inbound-secret": env.INBOUND_SECRET },
      body: JSON.stringify(body),
    });
  },
};
