import { unstable_cache } from "next/cache";

import { publicClient } from "@/lib/supabase/public";
import type { GenreRow } from "@/lib/supabase/types";

// Client-safe; re-exported here so `@/lib/genres` importers need not change.
export { genreName } from "@/lib/listings-format";

// Genres are reference data that changes almost never, and are read on nearly
// every page (home, search, add, edit, browse). Cache them across requests so
// they don't cost a DB round-trip each time. Invalidate with `revalidateTag`
// on the "genres" tag if the taxonomy ever changes.
export const getGenres = unstable_cache(
  async (): Promise<GenreRow[]> => {
    const supabase = publicClient();
    const { data } = await supabase.from("genres").select("*").order("id");
    return (data as GenreRow[]) ?? [];
  },
  ["genres"],
  { revalidate: 3600, tags: ["genres"] },
);
