import { setRequestLocale, getTranslations } from "next-intl/server";
import { BookMarked } from "lucide-react";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

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
  const tPages = await getTranslations("pages");

  return (
    <>
      <PageHeader title={tAuth("myListings")} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <BookMarked className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="max-w-sm text-muted-foreground">
            {tPages("comingSoon")}
          </p>
        </div>
      </div>
    </>
  );
}
