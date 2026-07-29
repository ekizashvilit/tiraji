import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { coverUrl, formatLari, type ListingCard } from "@/lib/listings";
import { cn } from "@/lib/utils";

// Deterministic "book spine" gradient for listings without a cover image.
const SPINES = [
  "linear-gradient(150deg,#1f7a4d,#0f3f28)",
  "linear-gradient(150deg,#b4551f,#6d2f10)",
  "linear-gradient(150deg,#2563eb,#152f6b)",
  "linear-gradient(150deg,#7c3a55,#3f1c2c)",
  "linear-gradient(150deg,#0e7c86,#083f45)",
  "linear-gradient(150deg,#b08307,#6b4f04)",
];

function spineFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SPINES[h % SPINES.length];
}

export function BookCard({
  listing,
  className,
}: {
  listing: ListingCard;
  className?: string;
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
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 40vw, 160px"
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
    return <p className="text-sm font-semibold text-muted-foreground">{t("negotiable")}</p>;
  }
  return (
    <p className="text-sm font-bold text-price">
      {formatLari(listing.price)}
    </p>
  );
}
