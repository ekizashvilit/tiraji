import { setRequestLocale, getTranslations } from "next-intl/server";

import { BrowsePage, type BrowseSearchParams } from "@/components/browse-page";

export default async function GiveawayPage({
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
      type="giveaway"
      title={t("giveTitle")}
      lede={t("giveLede")}
      accent="give"
      locale={locale}
      searchParams={sp}
    />
  );
}
