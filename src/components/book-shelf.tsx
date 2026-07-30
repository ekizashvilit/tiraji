import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { BookCard } from "@/components/book-card";
import { ScrollRow } from "@/components/scroll-row";
import type { ListingCard } from "@/lib/listings";

// A horizontally-scrolling row of book cards (like the reference sites' shelves).
export function BookShelf({
  title,
  href,
  listings,
  accent,
  priority = false,
}: {
  title: string;
  href: string;
  listings: ListingCard[];
  accent?: "buy" | "swap" | "give";
  // Eager-load the first few covers — use only for the first, above-the-fold shelf.
  priority?: boolean;
}) {
  const t = useTranslations("common");
  if (listings.length === 0) return null;

  const dot =
    accent === "swap" ? "bg-swap" : accent === "give" ? "bg-give" : "bg-buy";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="caps flex items-center gap-2 text-lg font-bold sm:text-xl">
          <span className={`h-4 w-1 rounded-full ${dot}`} aria-hidden />
          {title.toUpperCase()}
        </h2>
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          {t("viewAll")}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ScrollRow>
        {listings.map((listing, i) => (
          <BookCard
            key={listing.id}
            listing={listing}
            priority={priority && i < 4}
            className="w-[42vw] shrink-0 sm:w-40"
          />
        ))}
      </ScrollRow>
    </section>
  );
}
