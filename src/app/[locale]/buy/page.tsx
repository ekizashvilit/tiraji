import { setRequestLocale, getTranslations } from "next-intl/server";
import { BookMarked } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { BookGrid } from "@/components/book-grid";
import { searchListings } from "@/lib/listings";

export default async function BuyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; genre?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q, genre } = await searchParams;
  const t = await getTranslations("pages");

  const listings = await searchListings({
    q,
    type: "sale",
    genre: genre ? Number(genre) : undefined,
  });

  return (
    <>
      <PageHeader title={t("buyTitle")} lede={t("buyLede")} accent="buy" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {q && (
          <p className="mb-4 text-muted-foreground">
            {t("searchingFor", { query: q })}
          </p>
        )}
        {listings.length > 0 ? (
          <BookGrid listings={listings} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <BookMarked
              className="h-10 w-10 text-muted-foreground"
              aria-hidden
            />
            <p className="max-w-sm text-muted-foreground">{t("resultsSoon")}</p>
          </div>
        )}
      </div>
    </>
  );
}
