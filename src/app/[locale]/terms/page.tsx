import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");

  return (
    <>
      <PageHeader title={t("termsTitle")} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-muted-foreground">{t("comingSoon")}</p>
      </div>
    </>
  );
}
