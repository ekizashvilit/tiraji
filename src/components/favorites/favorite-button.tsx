"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { cn } from "@/lib/utils";

// The heart toggle. Two shapes: a floating overlay for book cards, and a labeled
// inline button for the listing detail page. Both hit the shared FavoritesProvider.
export function FavoriteButton({
  listingId,
  variant = "overlay",
  className,
}: {
  listingId: string;
  variant?: "overlay" | "inline";
  className?: string;
}) {
  const t = useTranslations("favorites");
  const { has, toggle } = useFavorites();
  const active = has(listingId);

  // On a card the button lives inside the card's <Link>, so stop the click from
  // navigating; on the detail page it's standalone but this is harmless there.
  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(listingId);
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary",
          active && "text-primary",
          className,
        )}
      >
        <Heart className={cn("size-4", active && "fill-current")} aria-hidden />
        {active ? t("saved") : t("save")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? t("saved") : t("save")}
      className={cn(
        "absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition group-hover:opacity-100 hover:bg-background focus-visible:opacity-100 aria-pressed:opacity-100",
        active && "text-primary opacity-100",
        className,
      )}
    >
      <Heart className={cn("size-4.5", active && "fill-current")} aria-hidden />
    </button>
  );
}
