"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/components/favorites/favorites-provider";

// Header shortcut to the saved-books shelf, with a count badge — the closest
// thing this marketplace has to a cart.
export function SavedButton() {
  const t = useTranslations("favorites");
  const { count } = useFavorites();

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative size-9 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground"
    >
      <Link href="/saved" aria-label={t("title")}>
        <Heart className="size-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid size-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.7rem] font-semibold text-primary-foreground ring-2 ring-background">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
