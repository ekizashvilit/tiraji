import { setRequestLocale, getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { getAdminUsers, ADMIN_USERS_PAGE_SIZE } from "@/lib/admin";
import { AdminUsers } from "@/components/admin/admin-users";
import { AdminSearch } from "@/components/admin/admin-search";
import { Pagination } from "@/components/search/pagination";

type SP = {
  q?: string;
  page?: string;
};

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const t = await getTranslations("admin");

  const page = Math.max(1, Number(sp.page) || 1);
  const [{ items, total }, supabase] = await Promise.all([
    getAdminUsers({ q: sp.q, page }),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const totalPages = Math.ceil(total / ADMIN_USERS_PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch placeholder={t("searchUsers")} />
        <p className="text-sm text-muted-foreground">
          {t("totalCount", { count: total })}
        </p>
      </div>

      <AdminUsers items={items} meId={user?.id ?? ""} />
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
