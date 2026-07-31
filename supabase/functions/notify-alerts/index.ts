// Book-alert match emails (Brevo).
//
// Finds active listings that haven't been scanned for alert matches yet,
// matches each against every active `book_alert` (ISBN exact, or fuzzy
// title/author via the match_book_alerts RPC), and emails each subscriber ONCE
// about the newly listed book(s) they were waiting for. Every scanned listing
// is stamped `alerts_notified_at` so it is never scanned — or emailed about —
// twice. Meant to be called on a schedule by pg_cron (see SETUP.md).
//
// Runs on Supabase Edge Functions (Deno). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected automatically; the rest are the SAME
// secrets the notify-unread function uses — nothing new to set.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// How many freshly-posted listings to scan per run. Comfortably above a day's
// realistic volume; anything not scanned this run is picked up next run.
const MAX_LISTINGS_PER_RUN = 200;
// Safety cap on emails per run to stay well inside Brevo's free daily quota.
const MAX_EMAILS_PER_RUN = 50;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://tiraji.ge";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL")!;
const FROM_NAME = Deno.env.get("FROM_NAME") ?? "ტირაჟი / Tiraji";

type Match = {
  alert_id: string;
  user_id: string;
  listing_id: string;
  listing_title: string;
  listing_author: string | null;
};

type Book = { id: string; title: string; author: string | null };

Deno.serve(async (req) => {
  // Only the scheduler (which knows the shared secret) may run this.
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1. Active listings we haven't scanned for alerts yet.
  const { data: pending, error: pendingErr } = await admin
    .from("listings")
    .select("id")
    .is("alerts_notified_at", null)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(MAX_LISTINGS_PER_RUN);

  if (pendingErr) return json({ error: pendingErr.message }, 500);
  const listingIds = (pending ?? []).map((r) => r.id as string);
  if (listingIds.length === 0) return json({ processed: 0, emailed: 0 });

  // 2. Which active alerts do those listings match?
  const { data: matchData, error: matchErr } = await admin.rpc(
    "match_book_alerts",
    { p_listing_ids: listingIds },
  );
  if (matchErr) return json({ error: matchErr.message }, 500);
  const matches = (matchData as Match[] | null) ?? [];

  let emailed = 0;

  if (matches.length > 0) {
    // 3. Group by subscriber, de-duplicating listings (a listing can match more
    //    than one of a user's alerts).
    const byUser = new Map<string, Map<string, Book>>();
    for (const m of matches) {
      let books = byUser.get(m.user_id);
      if (!books) {
        books = new Map();
        byUser.set(m.user_id, books);
      }
      books.set(m.listing_id, {
        id: m.listing_id,
        title: m.listing_title,
        author: m.listing_author,
      });
    }

    // 4. Email each subscriber (only accounts that have an email address).
    for (const [userId, bookMap] of byUser) {
      if (emailed >= MAX_EMAILS_PER_RUN) break; // rest waits for next run
      const { data: userData } = await admin.auth.admin.getUserById(userId);
      const email = userData?.user?.email ?? null;
      if (!email || !email.includes("@")) continue;

      const ok = await sendEmail(email, [...bookMap.values()]);
      if (ok) emailed++;
    }
  }

  // 5. Mark every scanned listing so it is never scanned again — regardless of
  //    whether it matched anything or an individual email failed. A missed
  //    match is preferable to spamming on every subsequent run.
  await admin
    .from("listings")
    .update({ alerts_notified_at: new Date().toISOString() })
    .in("id", listingIds);

  return json({ processed: listingIds.length, emailed });
});

// Sends one "your book was listed" email through Brevo. Bilingual, since we
// don't know the recipient's UI language. Returns true on success.
async function sendEmail(to: string, books: Book[]): Promise<boolean> {
  const base = SITE_URL.replace(/\/$/, "");
  const plural = books.length > 1;

  const items = books
    .map((b) => {
      const author = b.author ? ` — ${escapeHtml(b.author)}` : "";
      return `
        <li style="margin:0 0 8px">
          <a href="${base}/book/${b.id}"
             style="color:#B4551F;text-decoration:none;font-weight:bold;font-size:16px">
            ${escapeHtml(b.title)}</a><span style="color:#6B5F54">${author}</span>
        </li>`;
    })
    .join("");

  const subject = plural
    ? "ტირაჟი — დაემატა თქვენთვის საინტერესო წიგნები · New matching books on Tiraji"
    : "ტირაჟი — დაემატა თქვენთვის საინტერესო წიგნი · A book you wanted is now listed";

  const htmlContent = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#2B2420">
      <h2 style="color:#4A3428;margin:0 0 12px">ტირაჟი</h2>
      <p style="font-size:16px;line-height:1.6;margin:0 0 4px">
        ${plural ? "დაემატა წიგნები, რომლებზეც გამოწერა გაქვთ:" : "დაემატა წიგნი, რომელზეც გამოწერა გაქვთ:"}
      </p>
      <p style="font-size:14px;line-height:1.6;color:#6B5F54;margin:0 0 12px">
        ${plural ? "Books you subscribed to were just listed on Tiraji:" : "A book you subscribed to was just listed on Tiraji:"}
      </p>
      <ul style="list-style:none;padding:0;margin:0 0 20px">${items}</ul>
      <p style="font-size:13px;line-height:1.6;color:#6B5F54;margin:0">
        <a href="${base}/account/alerts" style="color:#6B5F54">გამოწერების მართვა · Manage your alerts</a>
      </p>
    </div>`;

  const textLines = books.map(
    (b) => `• ${b.title}${b.author ? ` — ${b.author}` : ""}\n  ${base}/book/${b.id}`,
  );
  const textContent =
    `დაემატა წიგნი, რომელზეც გამოწერა გაქვთ / A book you wanted is now on Tiraji:\n\n` +
    `${textLines.join("\n")}\n\n` +
    `გამოწერების მართვა / Manage alerts: ${base}/account/alerts`;

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
