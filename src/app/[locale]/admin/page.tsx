import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/listings";
import { PageHeader } from "@/components/page-header";
import { AdminReports, type ReportItem } from "@/components/admin/admin-reports";
import type { ListingType, ListingStatus } from "@/lib/supabase/types";

type ReportRow = {
  id: string;
  reason: string | null;
  created_at: string;
  reporter: { display_name: string | null } | null;
  listing: {
    id: string;
    title: string;
    author: string | null;
    listing_type: ListingType;
    status: ListingStatus;
    cover_image_paths: string[];
    cover_external_url: string | null;
  } | null;
};

export default async function AdminPage({
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

  // Gate: admins only. Reading your own profile row is allowed by RLS.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user!.id)
    .maybeSingle<{ is_admin: boolean }>();
  if (!profile?.is_admin) {
    notFound();
  }

  const t = await getTranslations("admin");

  // RLS lets admins read every report, every profile and hidden listings.
  const { data } = await supabase
    .from("reports")
    .select(
      "id,reason,created_at,reporter:profiles(display_name),listing:listings(id,title,author,listing_type,status,cover_image_paths,cover_external_url)",
    )
    .order("created_at", { ascending: false });

  const items: ReportItem[] = ((data as ReportRow[] | null) ?? []).map((r) => ({
    id: r.id,
    reason: r.reason,
    created_at: r.created_at,
    reporterName: r.reporter?.display_name ?? null,
    listing: r.listing
      ? {
          id: r.listing.id,
          title: r.listing.title,
          author: r.listing.author,
          listing_type: r.listing.listing_type,
          status: r.listing.status,
          cover: coverUrl(r.listing),
        }
      : null,
  }));

  return (
    <>
      <PageHeader title={t("title")} lede={t("lede")} />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <AdminReports items={items} />
      </div>
    </>
  );
}
