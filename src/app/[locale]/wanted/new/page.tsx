import { setRequestLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGenres } from "@/lib/genres";
import { PageHeader } from "@/components/page-header";
import { WantedForm } from "@/components/wanted/wanted-form";

export default async function NewWantedPage({
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

  const genres = await getGenres();
  const t = await getTranslations("wanted");
  const tNav = await getTranslations("nav");

  return (
    <>
      <PageHeader
        title={t("postTitle")}
        lede={t("postLede")}
        crumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("wanted"), href: "/wanted" },
          { label: t("postTitle") },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <WantedForm genres={genres} />
      </div>
    </>
  );
}
