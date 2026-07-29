import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

// Privacy-safe public profile, exposed through the `public_seller` view
// (readable by anyone). Only the fields safe to show on a profile page.
export type PublicProfile = {
  id: string;
  display_name: string | null;
  city: string | null;
  created_at: string;
};

// Fetch one user's public profile. Returns null for an unknown id. Wrapped in
// React `cache` so generateMetadata and the page share a single query.
export const getPublicProfile = cache(
  async (id: string): Promise<PublicProfile | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_seller")
      .select("id,display_name,city,created_at")
      .eq("id", id)
      .maybeSingle<PublicProfile>();
    return data ?? null;
  },
);
