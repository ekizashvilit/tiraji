import { setRequestLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/listings";
import { PageHeader } from "@/components/page-header";
import {
  MyListingsList,
  type MyListing,
} from "@/components/my-listings/my-listings-list";
import type { ListingType, ListingStatus } from "@/lib/supabase/types";

type Row = {
  id: string;
  title: string;
  author: string | null;
  price: number | null;
  is_negotiable: boolean;
  listing_type: ListingType;
  status: ListingStatus;
  cover_image_paths: string[];
  cover_external_url: string | null;
};

export default async function MyListingsPage({
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

  const tAuth = await getTranslations("auth");
  const tNav = await getTranslations("nav");

  const { data } = await supabase
    .from("listings")
    .select(
      "id,title,author,price,is_negotiable,listing_type,status,cover_image_paths,cover_external_url",
    )
    .eq("seller_id", user!.id)
    .order("created_at", { ascending: false });

  const items: MyListing[] = ((data as Row[]) ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    author: l.author,
    price: l.price,
    is_negotiable: l.is_negotiable,
    listing_type: l.listing_type,
    status: l.status,
    cover: coverUrl(l),
    cover_image_paths: l.cover_image_paths,
  }));

  return (
    <>
      <PageHeader
        title={tAuth("myListings")}
        crumbs={[
          { label: tNav("home"), href: "/" },
          { label: tAuth("myListings") },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <MyListingsList items={items} />
      </div>
    </>
  );
}
