import { setRequestLocale, getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";

import { redirect, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { BookGrid } from "@/components/book-grid";
import { ClearUnavailable } from "@/components/favorites/clear-unavailable";
import { Button } from "@/components/ui/button";
import type { ListingCard } from "@/lib/listings";

const CARD_COLUMNS =
  "id,title,author,price,is_negotiable,listing_type,city,cover_image_paths,cover_external_url";

type FavRow = { listing_id: string; listings: ListingCard | null };

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/?auth=required", locale });
  }

  const t = await getTranslations("favorites");
  const tNav = await getTranslations("nav");

  // Newest-saved first, with the listing joined. RLS on `listings` returns only
  // active rows to a non-owner, so a sold/hidden/deleted book comes back null.
  const { data } = await supabase
    .from("favorites")
    .select(`listing_id, created_at, listings (${CARD_COLUMNS})`)
    .order("created_at", { ascending: false });

  const rows = ((data ?? []) as unknown as FavRow[]);
  const listings = rows
    .map((r) => r.listings)
    .filter((l): l is ListingCard => l != null);
  const unavailable = rows.filter((r) => r.listings == null).map((r) => r.listing_id);

  const isEmpty = listings.length === 0 && unavailable.length === 0;

  return (
    <>
      <PageHeader
        title={t("title")}
        lede={t("lede")}
        crumbs={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <Heart className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="max-w-sm text-muted-foreground">{t("empty")}</p>
            <Button asChild size="lg">
              <Link href="/buy">{t("emptyCta")}</Link>
            </Button>
          </div>
        ) : (
          <>
            {listings.length > 0 && <BookGrid listings={listings} />}
            {unavailable.length > 0 && (
              <ClearUnavailable ids={unavailable} count={unavailable.length} />
            )}
          </>
        )}
      </div>
    </>
  );
}
