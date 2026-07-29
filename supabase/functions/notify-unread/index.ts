// Unread-message email reminders (Brevo).
//
// Finds messages that have been unread for a while and haven't triggered an
// email yet, then sends the recipient ONE email per run summarising how many
// conversations are waiting. Marks those messages `notified_at` so they never
// email twice. Meant to be called on a schedule by pg_cron (see SETUP.md).
//
// Runs on Supabase Edge Functions (Deno). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected automatically; the rest are secrets
// you set with `supabase secrets set` (see SETUP.md).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// How long a message may sit unread before we email (hours).
const UNREAD_HOURS = 2;
// Safety cap per run so we stay comfortably inside Brevo's free daily quota.
const MAX_EMAILS_PER_RUN = 50;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://tiraji.ge";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL")!;
const FROM_NAME = Deno.env.get("FROM_NAME") ?? "ტირაჟი / Tiraji";

type Row = {
  id: string;
  conversation_id: string;
  sender_id: string;
  conversation: {
    buyer_id: string;
    seller_id: string;
  } | null;
};

type Recipient = {
  conversations: Set<string>;
  senders: Set<string>;
  messageIds: string[];
};

Deno.serve(async (req) => {
  // Only the scheduler (which knows the shared secret) may run this.
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const threshold = new Date(
    Date.now() - UNREAD_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // Messages unread long enough and not yet emailed about.
  const { data, error } = await admin
    .from("messages")
    .select(
      "id, conversation_id, sender_id, conversation:conversations!inner(buyer_id, seller_id)",
    )
    .is("read_at", null)
    .is("notified_at", null)
    .lt("created_at", threshold)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (error) return json({ error: error.message }, 500);
  const rows = (data as Row[] | null) ?? [];
  if (rows.length === 0) return json({ processed: 0, emailed: 0 });

  // Group by the person who should receive the email (the non-sender party).
  const recipients = new Map<string, Recipient>();
  for (const r of rows) {
    if (!r.conversation) continue;
    const recipientId =
      r.sender_id === r.conversation.buyer_id
        ? r.conversation.seller_id
        : r.conversation.buyer_id;
    let entry = recipients.get(recipientId);
    if (!entry) {
      entry = { conversations: new Set(), senders: new Set(), messageIds: [] };
      recipients.set(recipientId, entry);
    }
    entry.conversations.add(r.conversation_id);
    entry.senders.add(r.sender_id);
    entry.messageIds.push(r.id);
  }

  // Names of everyone who sent an unread message (for the email body).
  const senderIds = [...new Set(rows.map((r) => r.sender_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", senderIds);
  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p.display_name as string | null]),
  );

  const finalize: string[] = []; // message ids to mark notified this run
  let emailed = 0;

  for (const [recipientId, info] of recipients) {
    if (emailed >= MAX_EMAILS_PER_RUN) break; // rest waits for the next run

    // Look up the recipient's email. Phone-only accounts have none — skip them,
    // but still mark handled so we don't rescan them forever.
    const { data: userData } = await admin.auth.admin.getUserById(recipientId);
    const email = userData?.user?.email ?? null;
    if (!email || !email.includes("@")) {
      finalize.push(...info.messageIds);
      continue;
    }

    const names =
      [...info.senders]
        .map((id) => nameById.get(id)?.trim() || null)
        .filter(Boolean)
        .join(", ") || "მომხმარებელი / a user";

    const ok = await sendEmail(email, names, info.conversations.size);
    if (ok) {
      finalize.push(...info.messageIds);
      emailed++;
    }
    // On send failure we leave the messages un-notified so the next run retries.
  }

  if (finalize.length > 0) {
    await admin
      .from("messages")
      .update({ notified_at: new Date().toISOString() })
      .in("id", finalize);
  }

  return json({ processed: finalize.length, emailed });
});

// Sends one reminder email through Brevo. Bilingual, since we don't know the
// recipient's UI language. Returns true on success.
async function sendEmail(
  to: string,
  senderNames: string,
  conversationCount: number,
): Promise<boolean> {
  const link = `${SITE_URL.replace(/\/$/, "")}/messages`;
  const plural = conversationCount > 1;

  const subject = "ტირაჟი — გაქვთ წაუკითხავი შეტყობინება · You have unread messages";

  const htmlContent = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#2B2420">
      <h2 style="color:#4A3428;margin:0 0 12px">ტირაჟი</h2>
      <p style="font-size:16px;line-height:1.6;margin:0 0 8px">
        თქვენ გაქვთ ${plural ? `${conversationCount} წაუკითხავი მიმოწერა` : "წაუკითხავი შეტყობინება"}
        ${senderNames}-გან.
      </p>
      <p style="font-size:14px;line-height:1.6;color:#6B5F54;margin:0 0 20px">
        You have unread message${plural ? "s" : ""} from ${senderNames} on Tiraji.
      </p>
      <a href="${link}"
         style="display:inline-block;background:#B4551F;color:#fff;text-decoration:none;
                font-weight:bold;padding:12px 20px;border-radius:8px;font-size:15px">
        შეტყობინებების ნახვა · View messages
      </a>
    </div>`;

  const textContent =
    `თქვენ გაქვთ წაუკითხავი შეტყობინება ${senderNames}-გან.\n` +
    `You have unread messages from ${senderNames} on Tiraji.\n\n${link}`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent,
    }),
  });

  if (!res.ok) {
    console.error("Brevo send failed", res.status, await res.text());
    return false;
  }
  return true;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
