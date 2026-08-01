import { setRequestLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getAdminListings, ADMIN_LISTINGS_PAGE_SIZE } from "@/lib/admin";
import { AdminListings } from "@/components/admin/admin-listings";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminDayPicker } from "@/components/admin/admin-day-picker";
import { Pagination } from "@/components/search/pagination";
import { cn } from "@/lib/utils";

type SP = {
  status?: string;
  type?: string;
  q?: string;
  day?: string;
  page?: string;
};

const STATUS_TABS = ["all", "active", "hidden", "closed"] as const;

// UTC date string N days before today (matches the day filter in getAdminListings).
function dayStr(offset: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

export default async function AdminListingsPage({
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
  const tStatus = await getTranslations("myListings");

  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total } = await getAdminListings({
    status: sp.status,
    type: sp.type,
    q: sp.q,
    day: sp.day,
    page,
  });
  const totalPages = Math.ceil(total / ADMIN_LISTINGS_PAGE_SIZE);
  const currentStatus = sp.status ?? "all";

  // Build a listings href, keeping the current filters and overriding some.
  const hrefWith = (over: Partial<Record<keyof SP, string | undefined>>) => {
    const merged = {
      status: sp.status,
      type: sp.type,
      q: sp.q,
      day: sp.day,
      ...over,
    };
    const p = new URLSearchParams();
    if (merged.status && merged.status !== "all")
      p.set("status", merged.status);
    if (merged.type) p.set("type", merged.type);
    if (merged.q) p.set("q", merged.q);
    if (merged.day) p.set("day", merged.day);
    const qs = p.toString();
    return qs ? `/admin/listings?${qs}` : "/admin/listings";
  };

  const dayChips = [
    { label: t("allDates"), day: undefined, active: !sp.day },
    { label: t("today"), day: dayStr(0), active: sp.day === dayStr(0) },
    { label: t("yesterday"), day: dayStr(1), active: sp.day === dayStr(1) },
    { label: t("dayBefore"), day: dayStr(2), active: sp.day === dayStr(2) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch placeholder={t("searchListings")} />
        <p className="text-sm text-muted-foreground">
          {t("totalCount", { count: total })}
        </p>
      </div>

      {/* Day filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        {dayChips.map((c) => (
          <Link
            key={c.label}
            href={hrefWith({ day: c.day })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              c.active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {c.label}
          </Link>
        ))}
        <AdminDayPicker label={t("pickDay")} />
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={hrefWith({ status: s === "all" ? undefined : s })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              currentStatus === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {s === "all" ? t("filterAll") : tStatus(`status_${s}`)}
          </Link>
        ))}
      </div>

      <AdminListings items={items} />
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
