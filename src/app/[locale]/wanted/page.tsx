import { setRequestLocale, getTranslations } from "next-intl/server";

import { BrowsePage, type BrowseSearchParams } from "@/components/browse-page";

// Books people are looking for. Same faceted browse as Buy/Swap/Giveaway, but
// scoped to the 'wanted' listing type. Posting a wanted book is done from the
// account / mobile menu ("Post a wanted book").
export default async function WantedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<BrowseSearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("pages");

  return (
    <BrowsePage
      type="wanted"
      title={t("wantedTitle")}
      lede={t("wantedLede")}
      accent="buy"
      locale={locale}
      searchParams={sp}
    />
  );
}
