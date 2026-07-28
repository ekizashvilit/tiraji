import { createClient } from "@/lib/supabase/server";
import type { GenreRow } from "@/lib/supabase/types";

export async function getGenres(): Promise<GenreRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("genres").select("*").order("id");
  return (data as GenreRow[]) ?? [];
}

export function genreName(genre: GenreRow, locale: string): string {
  return locale === "en" ? genre.name_en : genre.name_ka;
}
