import { setRequestLocale, getTranslations } from "next-intl/server";
import { PlusCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");

  return (
    <>
      <PageHeader title={t("sellTitle")} lede={t("sellLede")} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <PlusCircle className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="max-w-sm text-muted-foreground">{t("comingSoon")}</p>
        </div>
      </div>
    </>
  );
}
