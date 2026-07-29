import { setRequestLocale, getTranslations } from "next-intl/server";

import { BrowsePage, type BrowseSearchParams } from "@/components/browse-page";

export default async function SwapPage({
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
      type="swap"
      title={t("swapTitle")}
      lede={t("swapLede")}
      accent="swap"
      locale={locale}
      searchParams={sp}
    />
  );
}
