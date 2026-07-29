import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";

import { Link } from "@/i18n/navigation";

// Common Georgian authors / titles (same in both locales — used as search queries).
const TAGS = [
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

  return (
    <section>
      <h2 className="caps mb-5 text-lg font-bold sm:text-xl">
        {t("popularTitle").toUpperCase()}
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {TAGS.map((tag) => (
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
