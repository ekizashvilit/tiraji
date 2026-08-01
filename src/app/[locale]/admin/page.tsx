import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Users,
  BookOpen,
  MessagesSquare,
  Bell,
  Heart,
  Flag,
  ShoppingBag,
  ArrowLeftRight,
  Gift,
} from "lucide-react";

import { getDashboardStats, type DayCount } from "@/lib/admin";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const stats = await getDashboardStats();

  if (!stats) {
    return <p className="text-muted-foreground">{t("statsError")}</p>;
  }

  return (
    <div className="space-y-8">
      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-5" />}
          label={t("statUsers")}
          value={stats.users_total}
          hint={t("statNew30", { count: stats.users_30d })}
        />
        <StatCard
          icon={<BookOpen className="size-5" />}
          label={t("statListings")}
          value={stats.listings_total}
          hint={t("statNew30", { count: stats.listings_30d })}
        />
        <StatCard
          icon={<MessagesSquare className="size-5" />}
          label={t("statConversations")}
          value={stats.conversations_total}
          hint={t("statMessages", { count: stats.messages_total })}
        />
        <StatCard
          icon={<Flag className="size-5" />}
          label={t("statReports")}
          value={stats.reports_total}
          hint={t("statBookAlerts", { count: stats.alerts_total })}
        />
      </div>

      {/* Listings breakdown */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t("listingsBreakdown")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat
            label={t("statActive")}
            value={stats.listings_active}
            tone="text-buy"
          />
          <MiniStat
            label={t("statHidden")}
            value={stats.listings_hidden}
            tone="text-muted-foreground"
          />
          <MiniStat
            label={t("statClosed")}
            value={stats.listings_closed}
            tone="text-muted-foreground"
          />
          <MiniStat
            label={t("statSale")}
            value={stats.listings_sale}
            icon={<ShoppingBag className="size-4" />}
          />
          <MiniStat
            label={t("statSwap")}
            value={stats.listings_swap}
            icon={<ArrowLeftRight className="size-4" />}
          />
          <MiniStat
            label={t("statGiveaway")}
            value={stats.listings_giveaway}
            icon={<Gift className="size-4" />}
          />
        </div>
      </section>

      {/* Trends */}
      <section className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title={t("chartListings")}
          subtitle={t("last30days")}
          series={stats.listings_daily}
          locale={locale}
        />
        <TrendChart
          title={t("chartSignups")}
          subtitle={t("last30days")}
          series={stats.users_daily}
          locale={locale}
        />
      </section>

      {/* Engagement */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t("engagement")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat
            label={t("statBookAlertsShort")}
            value={stats.alerts_total}
            icon={<Bell className="size-4" />}
          />
          <MiniStat
            label={t("statFavorites")}
            value={stats.favorites_total}
            icon={<Heart className="size-4" />}
          />
          <MiniStat
            label={t("statNew7Users")}
            value={stats.users_7d}
            icon={<Users className="size-4" />}
          />
          <MiniStat
            label={t("statToday")}
            value={stats.listings_today}
            icon={<BookOpen className="size-4" />}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">
        {value.toLocaleString()}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`mt-1 text-xl font-bold tabular-nums ${tone ?? ""}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// A 30-day bar chart. The RPC only returns days that have data, so we fill the
// gaps to a continuous 30-day axis before rendering.
function TrendChart({
  title,
  subtitle,
  series,
  locale,
}: {
  title: string;
  subtitle: string;
  series: DayCount[];
  locale: string;
}) {
  const days = fill30(series);
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const dayFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="text-2xl font-bold tabular-nums">{total}</span>
      </div>
      <div className="mt-4 flex h-28 items-end gap-[3px]">
        {days.map((d) => (
          <div
            key={d.day}
            className="group relative flex-1 rounded-t-sm bg-primary/80 transition-colors hover:bg-primary"
            style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
            title={`${dayFmt.format(new Date(d.day))}: ${d.count}`}
          />
        ))}
      </div>
    </div>
  );
}

function fill30(series: DayCount[]): DayCount[] {
  const map = new Map(series.map((s) => [s.day.slice(0, 10), s.count]));
  const out: DayCount[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: map.get(key) ?? 0 });
  }
  return out;
}
