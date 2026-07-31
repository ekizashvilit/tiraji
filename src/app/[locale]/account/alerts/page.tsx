import { setRequestLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AlertsManager } from "@/components/alerts/alerts-manager";
import type { BookAlertRow } from "@/lib/supabase/types";

type Alert = Pick<BookAlertRow, "id" | "title" | "author" | "created_at">;

export default async function AlertsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { title: prefillTitle } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/?auth=required", locale });
  }

  // RLS scopes book_alerts to the owner, so this returns only this user's rows.
  const { data } = await supabase
    .from("book_alerts")
    .select("id, title, author, created_at")
    .order("created_at", { ascending: false });

  const t = await getTranslations("alerts");
  const tNav = await getTranslations("nav");
  const tAccount = await getTranslations("account");

  return (
    <>
      <PageHeader
        title={t("pageTitle")}
        lede={t("pageLede")}
        crumbs={[
          { label: tNav("home"), href: "/" },
          { label: tAccount("title"), href: "/account" },
          { label: t("pageTitle") },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <AlertsManager
          initial={(data as Alert[] | null) ?? []}
          defaultTitle={prefillTitle ?? ""}
        />
      </div>
    </>
  );
}
