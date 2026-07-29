"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { BookMarked, EyeOff, Loader2, ShieldCheck, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import type { ListingType, ListingStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ReportItem = {
  id: string;
  reason: string | null;
  created_at: string;
  reporterName: string | null;
  listing: {
    id: string;
    title: string;
    author: string | null;
    listing_type: ListingType;
    status: ListingStatus;
    cover: string | null;
  } | null;
};

export function AdminReports({ items }: { items: ReportItem[] }) {
  const t = useTranslations("admin");
  const tStatus = useTranslations("myListings");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Hide the reported listing from public view, then clear this report.
  async function hide(item: ReportItem) {
    if (!item.listing) return;
    setBusyId(item.id);
    const { error } = await supabase
      .from("listings")
      .update({ status: "hidden" })
      .eq("id", item.listing.id);
    if (!error) await supabase.from("reports").delete().eq("id", item.id);
    setBusyId(null);
    if (error) return toast.error(t("actionError"));
    toast.success(t("hidden"));
    router.refresh();
  }

  // Permanently delete the listing (cascade removes its reports too).
  async function removeListing(item: ReportItem) {
    if (!item.listing) return;
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusyId(item.id);
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", item.listing.id);
    setBusyId(null);
    if (error) return toast.error(t("actionError"));
    toast.success(t("deleted"));
    router.refresh();
  }

  // False alarm — drop the report, leave the listing untouched.
  async function dismiss(item: ReportItem) {
    setBusyId(item.id);
    const { error } = await supabase.from("reports").delete().eq("id", item.id);
    setBusyId(null);
    if (error) return toast.error(t("actionError"));
    toast.success(t("dismissed"));
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" aria-hidden />
        <p className="max-w-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const busy = busyId === item.id;
        const listing = item.listing;
        return (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-card p-3 sm:p-4"
          >
            <div className="flex gap-4">
              <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                {listing?.cover ? (
                  <Image
                    src={listing.cover}
                    alt={listing.title}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <BookMarked
                      className="size-6 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {listing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/book/${listing.id}`}
                      className="font-semibold hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <StatusBadge
                      status={listing.status}
                      label={tStatus(`status_${listing.status}`)}
                    />
                  </div>
                ) : (
                  <p className="font-semibold text-muted-foreground">
                    {t("listingGone")}
                  </p>
                )}
                {listing?.author && (
                  <p className="truncate text-sm text-muted-foreground">
                    {listing.author}
                  </p>
                )}

                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">{t("reason")}: </span>
                  {item.reason?.trim() || (
                    <span className="italic text-muted-foreground">
                      {t("noReason")}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("reportedBy", {
                    name: item.reporterName?.trim() || t("anonymous"),
                  })}{" "}
                  · {dateFmt.format(new Date(item.created_at))}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              {listing && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={busy}
                    onClick={() => hide(item)}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <EyeOff className="size-4" aria-hidden />
                    )}
                    {t("hide")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    disabled={busy}
                    onClick={() => removeListing(item)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    {t("deleteListing")}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => dismiss(item)}
              >
                {t("dismiss")}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: ListingStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-xs font-medium",
        status === "active" && "bg-primary/10 text-primary",
        status === "closed" && "bg-muted text-muted-foreground",
        status === "hidden" && "bg-destructive/10 text-destructive",
      )}
    >
      {label}
    </span>
  );
}
