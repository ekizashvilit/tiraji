import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { LegalContent } from "@/components/legal-content";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const tl = await getTranslations("legal");
  const tNav = await getTranslations("nav");

  return (
    <>
      <PageHeader
        title={t("termsTitle")}
        titleBelowCrumbs
        crumbs={[
          { label: tNav("home"), href: "/" },
          { label: t("termsTitle") },
        ]}
      />
      <LegalContent
        updated={tl("updated")}
        intro={tl("termsIntro")}
        sections={
          tl.raw("termsSections") as { heading: string; body: string[] }[]
        }
      />
    </>
  );
}
