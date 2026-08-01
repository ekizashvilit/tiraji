"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BookMarked, Loader2, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import type { ListingType, ListingStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

export type MyListing = {
  id: string;
  title: string;
  author: string | null;
  price: number | null;
  is_negotiable: boolean;
  listing_type: ListingType;
  status: ListingStatus;
  cover: string | null;
  cover_image_paths: string[];
};

export function MyListingsList({ items }: { items: MyListing[] }) {
  const t = useTranslations("myListings");
  const tCard = useTranslations("card");
  const tc = useTranslations("common");
  const router = useRouter();
  const confirm = useConfirm();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(item: MyListing, status: ListingStatus) {
    setBusyId(item.id);
    const { error } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", item.id);
    setBusyId(null);
    if (error) {
      toast.error(t("actionError"));
      return;
    }
    toast.success(status === "active" ? t("reactivated") : t("closed"));
    router.refresh();
  }

  async function remove(item: MyListing) {
    if (
      !(await confirm({
        title: t("deleteConfirm"),
        confirmLabel: t("delete"),
        cancelLabel: tc("cancel"),
        destructive: true,
      }))
    )
      return;
    setBusyId(item.id);
    // Remove the uploaded cover files first so they don't orphan in storage.
    if (item.cover_image_paths.length) {
      await supabase.storage.from("covers").remove(item.cover_image_paths);
    }
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", item.id);
    setBusyId(null);
    if (error) {
      toast.error(t("actionError"));
      return;
    }
    toast.success(t("deleted"));
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
        <BookMarked className="h-10 w-10 text-muted-foreground" aria-hidden />
        <p className="max-w-sm text-muted-foreground">{t("empty")}</p>
        <Button asChild size="lg">
          <Link href="/sell">{t("emptyCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const busy = busyId === item.id;
        return (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
          >
            <div className="relative h-20 w-15 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              {item.cover ? (
                <Image
                  src={item.cover}
                  alt={item.title}
                  fill
                  sizes="60px"
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">{item.title}</p>
                <StatusBadge
                  status={item.status}
                  label={t(`status_${item.status}`)}
                />
              </div>
              {item.author && (
                <p className="truncate text-sm text-muted-foreground">
                  {item.author}
                </p>
              )}
              <p className="mt-0.5 text-sm">
                <PriceOrTag item={item} tCard={tCard} />
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Wanted posts have no rich edit form yet — manage via close/delete. */}
              {item.listing_type !== "wanted" && (
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href={`/my-listings/${item.id}/edit`}>
                    <Pencil className="size-4" aria-hidden />
                    {t("edit")}
                  </Link>
                </Button>
              )}
              {item.status === "active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setStatus(item, "closed")}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    t("markClosed")
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setStatus(item, "active")}
                  className="gap-1.5"
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RotateCcw className="size-4" aria-hidden />
                  )}
                  {t("reactivate")}
                </Button>
              )}
              <Button
                variant="destructive"
                size="icon-sm"
                disabled={busy}
                aria-label={t("delete")}
                onClick={() => remove(item)}
              >
                <Trash2 className="size-4" aria-hidden />
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
        status === "active"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

function PriceOrTag({
  item,
  tCard,
}: {
  item: MyListing;
  tCard: (key: string) => string;
}) {
  if (item.listing_type === "wanted") {
    return (
      <span className="font-medium text-primary">
        {tCard("wanted")}
        {item.price != null && (
          <span className="ml-1.5 font-bold text-price">{`₾${item.price}`}</span>
        )}
      </span>
    );
  }
  if (item.listing_type === "swap") {
    return <span className="font-medium text-swap">{tCard("swap")}</span>;
  }
  if (item.listing_type === "giveaway") {
    return <span className="font-medium text-give">{tCard("free")}</span>;
  }
  // "Negotiable" means price by agreement — no fixed number, so it replaces the price.
  if (item.is_negotiable || item.price == null) {
    return (
      <span className="font-semibold text-muted-foreground">
        {tCard("negotiable")}
      </span>
    );
  }
  return <span className="font-bold text-price">{`₾${item.price}`}</span>;
}
