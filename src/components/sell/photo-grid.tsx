"use client";

import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Photo } from "@/components/sell/use-photos";

// The cover-photo picker + thumbnail grid for the sell form. Purely
// presentational — all state lives in usePhotos.
export function PhotoGrid({
  photos,
  checking,
  full,
  onAdd,
  onRemove,
}: {
  photos: Photo[];
  checking: boolean;
  full: boolean;
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}) {
  const t = useTranslations("sell");

  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {photos.map((photo, i) => (
        <div
          key={photo.url}
          className="relative size-24 overflow-hidden rounded-lg border border-border bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="" className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={t("removePhoto")}
            className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-foreground/70 text-white hover:bg-foreground"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
      {!full && (
        <label
          className={cn(
            "grid size-24 place-items-center gap-1 rounded-lg border border-dashed border-border p-2 text-center leading-tight text-muted-foreground",
            checking ? "cursor-wait opacity-70" : "cursor-pointer hover:bg-muted",
          )}
        >
          {checking ? (
            <Loader2 className="size-6 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-6" aria-hidden />
          )}
          <span className="text-xs">
            {checking ? t("checkingPhoto") : t("addPhotos")}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={checking}
            onChange={onAdd}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}
