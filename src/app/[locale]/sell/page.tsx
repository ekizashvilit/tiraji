import { setRequestLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGenres } from "@/lib/genres";
import { PageHeader } from "@/components/page-header";
import { SellForm } from "@/components/sell/sell-form";
import type { ListingType } from "@/lib/supabase/types";

const TYPES: ListingType[] = ["sale", "swap", "giveaway"];

export default async function SellPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const tNav = await getTranslations("nav");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/?auth=required", locale });
  }

  const [{ data: profile }, genres] = await Promise.all([
    supabase.from("profiles").select("city").eq("id", user!.id).single(),
    getGenres(),
  ]);

  const { type } = await searchParams;
  const defaultType: ListingType = TYPES.includes(type as ListingType)
    ? (type as ListingType)
    : "sale";

  return (
    <>
      <PageHeader
        title={t("sellTitle")}
        lede={t("sellLede")}
        crumbs={[
          { label: tNav("home"), href: "/" },
          { label: t("sellTitle") },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SellForm
          genres={genres}
          defaultCity={profile?.city ?? ""}
          defaultType={defaultType}
        />
      </div>
    </>
  );
}
