import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// A cookie-less, anonymous Supabase client for PUBLIC data reads that can be
// cached across requests. `unstable_cache` forbids request-time APIs (cookies,
// headers), so the normal cookie-bound server client (see ./server) can't be
// used inside a cached function. This client carries no session, so only use it
// for data that is identical for every visitor and readable under the anon RLS
// policies (active listings, genres). Never for anything user-specific.
let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function publicClient() {
  if (!client) {
    client = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}
