import { createClient } from "@/lib/supabase/server";

// Top real search terms (last 30 days), most-searched first. Returns [] on cold
// start or if the popular_searches RPC isn't available yet (before migration
// 0014) — callers blend in a seed list so the section is never empty.
export async function getPopularSearches(limit = 10): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("popular_searches", {
    p_limit: limit,
    p_days: 30,
  });
  return ((data as { term: string; hits: number }[] | null) ?? [])
    .map((r) => r.term)
    .filter(Boolean);
}
