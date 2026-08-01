import { createClient } from "@/lib/supabase/server";
import type { GenreRow } from "@/lib/supabase/types";

// Client-safe; re-exported here so `@/lib/genres` importers need not change.
export { genreName } from "@/lib/listings-format";

export async function getGenres(): Promise<GenreRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("genres").select("*").order("id");
  return (data as GenreRow[]) ?? [];
}
