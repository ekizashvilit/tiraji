"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Self-service account deletion. A Server Action is a public POST endpoint, so
// we never trust a client-supplied id — the target is always the authenticated
// caller's own id. Deleting the auth.users row cascades to their profile,
// listings, messages, conversations, favorites and alerts via FK.
export async function deleteMyAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);
}
