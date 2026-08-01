"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BookMarked, Eye, Loader2, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import type { ListingType } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

export type HiddenItem = {
  id: string;
  title: string;
  author: string | null;
  listing_type: ListingType;
  cover: string | null;
};

// Listings an admin has hidden — with a way to restore (unhide) or delete them.
// This is the recovery path: hiding a listing clears its report, so without
// this panel a hidden listing would have no route back to visible.
export function HiddenListings({ items }: { items: HiddenItem[] }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const confirm = useConfirm();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function unhide(item: HiddenItem) {
    setBusyId(item.id);
    const { error } = await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("id", item.id);
    setBusyId(null);
    if (error) return toast.error(t("actionError"));
    toast.success(t("restored"));
    router.refresh();
  }

  async function remove(item: HiddenItem) {
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
      <p className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-6 text-sm text-muted-foreground">
        {t("hiddenEmpty")}
      </p>
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
              <Link
                href={`/book/${item.id}`}
                className="font-semibold hover:underline"
              >
                {item.title}
              </Link>
              {item.author && (
                <p className="truncate text-sm text-muted-foreground">
                  {item.author}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={busy}
                onClick={() => unhide(item)}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
                {t("unhide")}
              </Button>
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
        );
      })}
    </ul>
  );
}
