import { createClient } from "./server";

// Returns the authenticated user (or null) from a Server Component / action.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
