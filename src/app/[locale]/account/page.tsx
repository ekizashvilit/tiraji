import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/account/profile-form";
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
    redirect({ href: "/login", locale });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<ProfileRow>();

  const t = await getTranslations("account");

  // Fall back to a minimal profile shape if the row isn't readable yet.
  const safeProfile: ProfileRow = profile ?? {
    id: user!.id,
    display_name: null,
    city: null,
    phone: null,
    show_phone: false,
    avatar_path: null,
    is_admin: false,
    created_at: new Date().toISOString(),
  };

  return (
    <>
      <PageHeader title={t("title")} lede={t("lede")} />
      <div className="mx-auto max-w-lg px-4 py-12">
        <ProfileForm profile={safeProfile} />
      </div>
    </>
  );
}
