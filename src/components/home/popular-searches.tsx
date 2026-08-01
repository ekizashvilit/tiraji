import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { getPopularSearches } from "@/lib/popular";

const MAX_TAGS = 10;

// Seed terms shown before real search data accumulates (and to top up the list
// when there aren't yet MAX_TAGS real ones). Same in both locales.
const SEED = [
  "ვეფხისტყაოსანი",
  "ნოდარ დუმბაძე",
  "დათა თუთაშხია",
  "აკა მორჩილაძე",
  "გურამ დოჩანაშვილი",
  "რევაზ ინანიშვილი",
  "Harry Potter",
  "1984",
  "Sapiens",
  "Dostoevsky",
];

export async function PopularSearches() {
  const t = await getTranslations("home");

  // Real searches first; fill any remaining slots with seed terms (deduped
  // case-insensitively) so the section is never empty or short.
  const real = await getPopularSearches(MAX_TAGS);
  const seen = new Set(real.map((term) => term.toLowerCase()));
  const tags = [...real];
  for (const seed of SEED) {
    if (tags.length >= MAX_TAGS) break;
    if (!seen.has(seed.toLowerCase())) {
      tags.push(seed);
      seen.add(seed.toLowerCase());
    }
  }

  return (
    <section>
      <h2 className="caps mb-5 text-lg font-bold sm:text-xl">
        {t("popularTitle").toUpperCase()}
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/search?q=${encodeURIComponent(tag)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            {tag}
          </Link>
        ))}
      </div>
    </section>
  );
}
