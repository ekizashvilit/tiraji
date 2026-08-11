"use server";

import { randomInt } from "node:crypto";

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

// Unambiguous alphabet (no 0/O/1/l/I) so a temp password is easy to read aloud
// or text to someone over the phone.
const TEMP_PW_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) out += TEMP_PW_ALPHABET[randomInt(TEMP_PW_ALPHABET.length)];
  return out;
}

// Set a fresh, generated password for a user and return it. Phone-only accounts
// have a synthetic @phone.tiraji.local email the self-serve reset email can't
// reach, so the admin resets here (after verifying the person controls the
// number) and reads them the temp password; they change it in-app after signing
// in. Works for email users too, as a manual fallback.
export async function resetUserPassword(userId: string): Promise<string> {
  const meId = await requireAdmin();
  if (userId === meId) throw new Error("cannot-target-self");

  const password = generateTempPassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);
  return password;
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
