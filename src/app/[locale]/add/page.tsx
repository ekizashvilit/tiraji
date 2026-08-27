import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGenres } from "@/lib/genres";
import { CREATABLE_TYPES } from "@/lib/listing-constants";
import { SellScreen } from "@/components/sell/sell-screen";
import type { ListingType } from "@/lib/supabase/types";

export default async function SellPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
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

  const [{ data: profile }, genres] = await Promise.all([
    supabase.from("profiles").select("city").eq("id", user!.id).single(),
    getGenres(),
  ]);

  const { type } = await searchParams;
  const defaultType: ListingType = CREATABLE_TYPES.includes(type as ListingType)
    ? (type as ListingType)
    : "sale";

  return (
    <SellScreen
      genres={genres}
      defaultCity={profile?.city ?? ""}
      defaultType={defaultType}
    />
  );
}
