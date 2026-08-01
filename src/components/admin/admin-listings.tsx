"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { BookMarked, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import type { AdminListing } from "@/lib/admin";
import type { ListingType, ListingStatus } from "@/lib/supabase/types";
import { formatLari } from "@/lib/listings-format";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const TYPE_KEY: Record<ListingType, string> = {
  sale: "typeSale",
  swap: "typeSwap",
  giveaway: "typeGiveaway",
  wanted: "typeWanted",
};

const STATUS_KEY: Record<ListingStatus, string> = {
  active: "status_active",
  closed: "status_closed",
  hidden: "status_hidden",
};

const STATUS_TONE: Record<ListingStatus, string> = {
  active: "bg-buy/10 text-buy",
  closed: "bg-muted text-muted-foreground",
  hidden: "bg-muted text-muted-foreground",
};

export function AdminListings({ items }: { items: AdminListing[] }) {
  const t = useTranslations("admin");
  const tType = useTranslations("filters");
  const tStatus = useTranslations("myListings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const confirm = useConfirm();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Day-group headers. Keys are UTC dates (matching the day filter), so "Today"
  // etc. line up with the chips on the page.
  const dayFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const utcKey = (offset: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - offset);
    return d.toISOString().slice(0, 10);
  };
  const todayKey = utcKey(0);
  const yesterdayKey = utcKey(1);
  const dayLabel = (key: string) => {
    if (key === todayKey) return t("today");
    if (key === yesterdayKey) return t("yesterday");
    return dayFmt.format(new Date(`${key}T00:00:00Z`));
  };

  async function setStatus(item: AdminListing, status: ListingStatus) {
    setBusyId(item.id);
    const { error } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", item.id);
    setBusyId(null);
    if (error) return toast.error(t("actionError"));
    toast.success(status === "hidden" ? t("hidden") : t("restored"));
    router.refresh();
  }

  async function remove(item: AdminListing) {
    if (
      !(await confirm({
        title: t("deleteConfirm"),
        confirmLabel: tc("delete"),
        cancelLabel: tc("cancel"),
        destructive: true,
      }))
    )
      return;
    setBusyId(item.id);
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", item.id);
    setBusyId(null);
    if (error) return toast.error(t("actionError"));
    toast.success(t("deleted"));
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-10 text-center text-sm text-muted-foreground">
        {t("noListings")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const busy = busyId === item.id;
        const price =
          item.listing_type === "sale"
            ? item.is_negotiable || item.price == null
              ? null
              : formatLari(item.price)
            : null;
        const dayKey = item.created_at.slice(0, 10);
        const prevKey = i > 0 ? items[i - 1].created_at.slice(0, 10) : null;
        return (
          <Fragment key={item.id}>
            {dayKey !== prevKey && (
              <li className="pt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground first:pt-0">
                {dayLabel(dayKey)}
              </li>
            )}
            <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 sm:flex-nowrap">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                {item.cover ? (
                  <Image
                    src={item.cover}
                    alt={item.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <BookMarked
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/book/${item.id}`}
                    className="truncate font-semibold hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      STATUS_TONE[item.status],
                    )}
                  >
                    {tStatus(STATUS_KEY[item.status])}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {[item.author, item.sellerName && `· ${item.sellerName}`]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tType(TYPE_KEY[item.listing_type])}
                  {price && <> · {price}</>} ·{" "}
                  {dateFmt.format(new Date(item.created_at))}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {item.status === "hidden" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={busy}
                    onClick={() => setStatus(item, "active")}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                    {t("unhide")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={busy}
                    onClick={() => setStatus(item, "hidden")}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <EyeOff className="size-4" aria-hidden />
                    )}
                    {t("hide")}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label={t("deleteListing")}
                  disabled={busy}
                  onClick={() => remove(item)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
