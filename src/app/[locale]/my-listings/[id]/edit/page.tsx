import { setRequestLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGenres } from "@/lib/genres";
import { PageHeader } from "@/components/page-header";
import { SellForm, type EditableListing } from "@/components/sell/sell-form";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/?auth=required", locale });
  }

  const [{ data: listing }, genres] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id,listing_type,title,author,condition,price,is_negotiable,swap_wanted,city,book_language,genre_id,cover_image_paths",
      )
      .eq("id", id)
      .eq("seller_id", user!.id)
      .single<EditableListing>(),
    getGenres(),
  ]);

  if (!listing) {
    redirect({ href: "/my-listings", locale });
  }

  return (
    <>
      <PageHeader title={t("editTitle")} lede={t("editLede")} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SellForm
          genres={genres}
          defaultCity={listing!.city ?? ""}
          defaultType={listing!.listing_type}
          listing={listing!}
        />
      </div>
    </>
  );
}
