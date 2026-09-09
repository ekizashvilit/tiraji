import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteURL } from "@/lib/site-url";

// Handles the redirect from an OAuth provider (e.g. Google). Redirects are
// built from the configured site URL (not the request host) so we never bounce
// the user onto 0.0.0.0 — a different cookie origin than localhost.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = getSiteURL();
  const code = searchParams.get("code");
  // Where to send the user afterwards (defaults to the homepage). Only accept a
  // same-origin relative path — a single leading slash, not "//host" or a full
  // URL — so the param can't be abused as an open redirect.
  const rawNext = searchParams.get("next") ?? "/";
  const next = /^\/(?!\/)/.test(rawNext) ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  // Something went wrong — send them home and flag the auth error (toast + sheet).
  return NextResponse.redirect(`${base}/?auth=error`);
}
