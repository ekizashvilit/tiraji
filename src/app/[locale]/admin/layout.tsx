import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

// Gate for every /admin route: signed-in admins only. Everything inside renders
// in the separate admin shell (its own sidebar chrome, no public header/footer).
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
    .select("is_admin,display_name")
    .eq("id", user!.id)
    .maybeSingle<{ is_admin: boolean; display_name: string | null }>();
  // Signed in but not an admin → send them back to the marketplace.
  if (!profile?.is_admin) {
    redirect({ href: "/", locale });
  }

  return (
    <AdminShell displayName={profile!.display_name}>{children}</AdminShell>
  );
}
