import {
  BookOpen,
  BookText,
  Feather,
  Baby,
  GraduationCap,
  Landmark,
  FlaskConical,
  Church,
  Palette,
  Library,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { genreName } from "@/lib/genres";
import type { GenreRow } from "@/lib/supabase/types";

const ICONS: Record<string, typeof BookOpen> = {
  fiction: BookText,
  nonfiction: BookOpen,
  poetry: Feather,
  children: Baby,
  academic: GraduationCap,
  history: Landmark,
  "sci-tech": FlaskConical,
  religion: Church,
  art: Palette,
  other: Library,
};

export function CategoryTiles({
  genres,
  locale,
}: {
  genres: GenreRow[];
  locale: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {genres.map((genre) => {
        const Icon = ICONS[genre.slug] ?? Library;
        return (
          <Link
            key={genre.id}
            href={`/search?genre=${genre.slug}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-medium">
              {genreName(genre, locale)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
