import { setRequestLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/account/profile-form";
import { ChangePassword } from "@/components/account/change-password";
import { DeleteAccount } from "@/components/account/delete-account";
import type { ProfileRow } from "@/lib/supabase/types";

export default async function AccountPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<ProfileRow>();

  const t = await getTranslations("account");
  const tNav = await getTranslations("nav");

  // Fall back to a minimal profile shape if the row isn't readable yet.
  const safeProfile: ProfileRow = profile ?? {
    id: user!.id,
    display_name: null,
    city: null,
    phone: null,
    show_phone: false,
    avatar_path: null,
    is_admin: false,
    banned: false,
    created_at: new Date().toISOString(),
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        lede={t("lede")}
        crumbs={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <ProfileForm profile={safeProfile} />
          <ChangePassword />
        </div>

        <DeleteAccount />
      </div>
    </>
  );
}
