import { setRequestLocale, getTranslations } from "next-intl/server";

import { BrowsePage, type BrowseSearchParams } from "@/components/browse-page";

export default async function BuyPage({
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
      type="sale"
      title={t("buyTitle")}
      lede={t("buyLede")}
      accent="buy"
      locale={locale}
      searchParams={sp}
    />
  );
}
