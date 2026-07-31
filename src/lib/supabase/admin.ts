import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

// Privileged Supabase client using the service-role key. It BYPASSES RLS
// entirely, so it must only ever run on the server — never import this into a
// client component or expose its results raw. Used for admin operations that
// RLS can't grant, e.g. banning/deleting a user's auth account.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service-role env vars are missing");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
