import { Fragment } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BookMarked } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/hero-search";
import { BookShelf } from "@/components/book-shelf";
import { getRecentListings, getListingsByType } from "@/lib/listings";
import { getGenres, genreName } from "@/lib/genres";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [recent, forSale, toSwap, free, genres] = await Promise.all([
    getRecentListings(12),
    getListingsByType("sale", 12),
    getListingsByType("swap", 12),
    getListingsByType("giveaway", 12),
    getGenres(),
  ]);

  const t = await getTranslations("home");
  const nav = await getTranslations("nav");
  const isEmpty = recent.length === 0;

  return (
    <div>
      {/* Editorial hero (AbeBooks-style) */}
      <section className="mx-auto max-w-3xl px-4 pb-8 pt-12 text-center">
        <div className="mb-3">
          <Link
            href="/buy"
            className="caps text-sm font-bold text-buy hover:underline"
          >
            {t("heroEyebrow").toUpperCase()}
          </Link>
        </div>
        <h1 className="text-4xl font-bold sm:text-5xl">
          {t("heroTitleUsed")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t("heroLead")}{" "}
          {genres.map((g, i) => (
            <Fragment key={g.id}>
              <Link
                href={`/buy?genre=${g.id}`}
                className="text-primary hover:underline"
              >
                {genreName(g, locale)}
              </Link>
              {i < genres.length - 1 ? ", " : " "}
            </Fragment>
          ))}
          {t("heroTail")}
        </p>
      </section>

      {/* Structured search panel */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <HeroSearch />
      </section>

      {/* Book shelves */}
      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-14">
        {isEmpty ? (
          <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <BookMarked
              className="h-10 w-10 text-muted-foreground"
              aria-hidden
            />
            <p className="max-w-sm text-muted-foreground">{t("emptyRecent")}</p>
            <Button asChild className="mt-2">
              <Link href="/sell">{nav("sell")}</Link>
            </Button>
          </section>
        ) : (
          <>
            <BookShelf
              title={t("recentTitle")}
              href="/buy"
              listings={recent}
              accent="buy"
            />
            <BookShelf
              title={t("forSaleTitle")}
              href="/buy"
              listings={forSale}
              accent="buy"
            />
            <BookShelf
              title={t("toSwapTitle")}
              href="/swap"
              listings={toSwap}
              accent="swap"
            />
            <BookShelf
              title={t("freeTitle")}
              href="/giveaway"
              listings={free}
              accent="give"
            />
          </>
        )}

        {/* Email alert band */}
        <section className="flex flex-col items-start gap-4 rounded-xl border border-border bg-secondary px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-brand-dark">
              {t("alertTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground">{t("alertDesc")}</p>
          </div>
          <Button asChild size="lg">
            <Link href="/buy">{t("alertCta")}</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
