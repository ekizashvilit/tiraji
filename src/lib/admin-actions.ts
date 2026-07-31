"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// A Server Action is a public POST endpoint, so render-time gating is NOT a
// security boundary — every action re-checks the caller here. Returns the
// caller's own id so actions can refuse to target the acting admin.
async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();
  if (!me?.is_admin) throw new Error("forbidden");
  return user.id;
}

// GoTrue expects a Go duration string; ~100 years is an effective permanent ban.
const BAN_DURATION = "876000h";

// Ban or unban a user. Sets both the profile flag (drives the UI + is_banned()
// RLS checks) and the auth-level ban (blocks login and token refresh).
export async function setUserBanned(userId: string, banned: boolean) {
  const meId = await requireAdmin();
  if (userId === meId) throw new Error("cannot-target-self");

  const admin = createAdminClient();

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ banned })
    .eq("id", userId);
  if (profileErr) throw new Error(profileErr.message);

  const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: banned ? BAN_DURATION : "none",
  });
  if (authErr) throw new Error(authErr.message);
}

// Permanently delete a user's auth account. FK cascades from auth.users clean up
// their profile, listings, messages, conversations and favorites automatically.
export async function deleteUser(userId: string) {
  const meId = await requireAdmin();
  if (userId === meId) throw new Error("cannot-target-self");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
