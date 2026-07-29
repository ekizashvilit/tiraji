import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, Pencil } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingDetail, coverUrls, formatLari } from "@/lib/listings";
import { spineFor } from "@/lib/spine";
import { genreName } from "@/lib/genres";
import { cityLabel } from "@/lib/cities";
import { languageLabel } from "@/lib/languages";
import type { ListingType, BookCondition } from "@/lib/supabase/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookGallery } from "@/components/book/book-gallery";
import { ContactSeller } from "@/components/book/contact-seller";
import { ReportButton } from "@/components/book/report-button";

type Params = { params: Promise<{ locale: string; id: string }> };

// Which browse page a listing belongs to (for the back link + accent colour).
const SECTION: Record<ListingType, { href: string; navKey: string; dot: string }> = {
  sale: { href: "/buy", navKey: "buy", dot: "bg-buy" },
  swap: { href: "/swap", navKey: "swap", dot: "bg-swap" },
  giveaway: { href: "/giveaway", navKey: "giveaway", dot: "bg-give" },
};

const CONDITION_KEY: Record<BookCondition, string> = {
  new: "condNew",
  like_new: "condLikeNew",
  good: "condGood",
  worn: "condWorn",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingDetail(id);
  if (!listing) return {};

  const images = coverUrls(listing);
  const description =
    listing.description?.slice(0, 160) ||
    [listing.title, listing.author].filter(Boolean).join(" — ");

  return {
    title: listing.title,
    description,
    openGraph: {
      title: listing.title,
      description,
      type: "website",
      images: images.length ? [{ url: images[0] }] : undefined,
    },
  };
}

export default async function BookPage({ params }: Params) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const listing = await getListingDetail(id);
  if (!listing) notFound();

  const t = await getTranslations("book");
  const tNav = await getTranslations("nav");
  const tf = await getTranslations("filters");
  const tCard = await getTranslations("card");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === listing.seller_id;

  const images = coverUrls(listing);
  const section = SECTION[listing.listing_type];
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const monthFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    month: "long",
    year: "numeric",
  });
  const posted = dateFmt.format(new Date(listing.created_at));

  const seller = listing.seller;
  const sellerName = seller?.display_name?.trim() || t("sellerFallback");
  const memberSince = seller ? monthFmt.format(new Date(seller.created_at)) : null;
  const phone = seller?.show_phone ? seller.phone : null;

  // Detail rows — only render the ones that have a value.
  const rows: { label: string; value: string }[] = [];
  if (listing.condition)
    rows.push({ label: tf("condition"), value: tf(CONDITION_KEY[listing.condition]) });
  if (listing.genre)
    rows.push({ label: tf("genre"), value: genreName(listing.genre, locale) });
  if (listing.book_language)
    rows.push({ label: tf("language"), value: languageLabel(listing.book_language, locale) });
  if (listing.city)
    rows.push({ label: tf("city"), value: cityLabel(listing.city, locale) });
  if (listing.isbn) rows.push({ label: t("isbn"), value: listing.isbn });
  rows.push({ label: t("posted"), value: posted });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        href={section.href}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {tNav(section.navKey)}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookGallery
            images={images}
            title={listing.title}
            author={listing.author}
            spine={spineFor(listing.title)}
          />
        </div>

        {/* Details */}
        <div className="min-w-0 space-y-6">
          {listing.status !== "active" && (
            <p className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground">
              {t("closedNotice")}
            </p>
          )}

          <div className="space-y-1.5">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground`}
            >
              <span className={`size-2 rounded-full ${section.dot}`} aria-hidden />
              {tNav(section.navKey)}
            </span>
            <h1 className="text-2xl font-bold sm:text-3xl">{listing.title}</h1>
            {listing.author && (
              <p className="text-lg text-muted-foreground">{listing.author}</p>
            )}
          </div>

          {/* Price / type */}
          <PriceBlock listing={listing} tCard={tCard} />

          {/* Seller + contact */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarFallback className="bg-secondary text-brand-dark">
                  {sellerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">{sellerName}</p>
                {memberSince && (
                  <p className="text-sm text-muted-foreground">
                    {t("memberSince", { date: memberSince })}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              {isOwner ? (
                <Link
                  href={`/my-listings/${listing.id}/edit`}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  <Pencil className="size-4" aria-hidden />
                  {t("editListing")}
                </Link>
              ) : (
                <ContactSeller phone={phone} />
              )}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <section className="space-y-2">
              <h2 className="font-semibold">{t("description")}</h2>
              <p className="whitespace-pre-line leading-relaxed text-foreground/90">
                {listing.description}
              </p>
            </section>
          )}

          {/* Swap wanted */}
          {listing.listing_type === "swap" && listing.swap_wanted && (
            <section className="space-y-2">
              <h2 className="font-semibold">{t("wantsInReturn")}</h2>
              <p className="whitespace-pre-line leading-relaxed text-foreground/90">
                {listing.swap_wanted}
              </p>
            </section>
          )}

          {/* Details table */}
          <section className="space-y-2">
            <h2 className="font-semibold">{t("details")}</h2>
            <dl className="divide-y divide-border rounded-xl border border-border">
              {rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {!isOwner && (
            <div className="pt-1">
              <ReportButton listingId={listing.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceBlock({
  listing,
  tCard,
}: {
  listing: { listing_type: ListingType; price: number | null; is_negotiable: boolean };
  tCard: (key: string) => string;
}) {
  if (listing.listing_type === "swap") {
    return (
      <span className="inline-flex rounded-lg bg-swap/10 px-3 py-1.5 text-lg font-semibold text-swap">
        {tCard("swap")}
      </span>
    );
  }
  if (listing.listing_type === "giveaway") {
    return (
      <span className="inline-flex rounded-lg bg-give/10 px-3 py-1.5 text-lg font-semibold text-give">
        {tCard("free")}
      </span>
    );
  }
  if (listing.is_negotiable || listing.price == null) {
    return (
      <p className="text-xl font-semibold text-muted-foreground">
        {tCard("negotiable")}
      </p>
    );
  }
  return <p className="text-3xl font-bold text-price">{formatLari(listing.price)}</p>;
}
