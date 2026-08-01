import { createClient } from "@/lib/supabase/client";

// Random, anonymous per-browser id so popular-search aggregation can count
// distinct browsers (one person repeating a term counts once). It is NOT a user
// id and is never used for anything but de-duping search counts.
function browserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem("tiraji:cid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("tiraji:cid", id);
    }
    return id;
  } catch {
    return null;
  }
}

// Fire-and-forget: record an executed search term for the homepage "popular
// searches" section. Only meaningful terms (2–100 chars) are logged, and any
// failure (e.g. offline, or before migration 0014 is applied) is ignored.
export function logSearch(term: string): void {
  const t = term.trim().replace(/\s+/g, " ");
  if (t.length < 2 || t.length > 100) return;
  const supabase = createClient();
  void supabase
    .from("search_events")
    .insert({ term: t, client_id: browserId() });
}
