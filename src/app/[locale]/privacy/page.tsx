import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { LegalContent } from "@/components/legal-content";

export default async function PrivacyPage({
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
        title={t("privacyTitle")}
        titleBelowCrumbs
        crumbs={[
          { label: tNav("home"), href: "/" },
          { label: t("privacyTitle") },
        ]}
      />
      <LegalContent
        updated={tl("updated")}
        intro={tl("privacyIntro")}
        sections={
          tl.raw("privacySections") as { heading: string; body: string[] }[]
        }
      />
    </>
  );
}
