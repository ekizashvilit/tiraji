import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { coverUrl, formatLari, type ListingCard } from "@/lib/listings";
import { spineFor } from "@/lib/spine";
import { cn } from "@/lib/utils";

export function BookCard({
  listing,
  className,
  priority = false,
}: {
  listing: ListingCard;
  className?: string;
  // Eager-load + preload this cover (use only for above-the-fold cards).
  priority?: boolean;
}) {
  const t = useTranslations("card");
  const cover = coverUrl(listing);

  return (
    <Link
      href={`/book/${listing.id}`}
      className={cn(
        "group flex flex-col gap-2 rounded-lg p-2 transition-colors hover:bg-accent/60",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-border bg-muted">
        {/* Wanted posts are requests, not items to save. */}
        {listing.listing_type !== "wanted" && (
          <FavoriteButton listingId={listing.id} />
        )}
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 40vw, 160px"
            priority={priority}
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="flex h-full flex-col justify-between p-3 text-white"
            style={{ backgroundImage: spineFor(listing.title) }}
          >
            {listing.author && (
              <span className="line-clamp-1 text-[11px] uppercase tracking-wide text-white/75">
                {listing.author}
              </span>
            )}
            <span className="line-clamp-4 text-sm font-semibold leading-tight">
              {listing.title}
            </span>
            <span className="h-px w-8 bg-white/40" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0">
        {/* Fixed-height zone, top-aligned: the title flows (1 or 2 lines) with
            the author tight beneath it, and the zone always reserves room for a
            2-line title + author so the price/tag below lands at the same
            height across every card. */}
        <div className="min-h-15 space-y-0.5">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {listing.title}
          </p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {listing.author}
          </p>
        </div>
        <PriceOrTag listing={listing} t={t} />
      </div>
    </Link>
  );
}

function PriceOrTag({
  listing,
  t,
}: {
  listing: ListingCard;
  t: (key: string) => string;
}) {
  if (listing.listing_type === "wanted") {
    // Books people are looking for — price (if any) is what they'll pay.
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          {t("wanted")}
        </span>
        {listing.price != null && (
          <span className="text-sm font-bold text-price">
            {formatLari(listing.price)}
          </span>
        )}
      </div>
    );
  }
  if (listing.listing_type === "swap") {
    return (
      <span className="inline-block rounded bg-swap/10 px-1.5 py-0.5 text-xs font-medium text-swap">
        {t("swap")}
      </span>
    );
  }
  if (listing.listing_type === "giveaway") {
    return (
      <span className="inline-block rounded bg-give/10 px-1.5 py-0.5 text-xs font-medium text-give">
        {t("free")}
      </span>
    );
  }
  // "Negotiable" (ფასი შეთანხმებით) means the price is by agreement — there's no
  // fixed number, so it replaces the price rather than sitting alongside it.
  if (listing.is_negotiable || listing.price == null) {
    return (
      <p className="text-sm font-semibold text-muted-foreground">
        {t("negotiable")}
      </p>
    );
  }
  return (
    <p className="text-sm font-bold text-price">{formatLari(listing.price)}</p>
  );
}
