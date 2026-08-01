"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useAuthSheet } from "@/components/auth/auth-sheet";

type FavoritesContextValue = {
  // Whether the current user's saved set has loaded (false only briefly for a
  // signed-in user whose ids weren't seeded from the server).
  ready: boolean;
  has: (listingId: string) => boolean;
  toggle: (listingId: string) => void;
  count: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}

// Holds the current user's set of saved listing ids for the whole app, so every
// heart button reads/writes one shared source of truth (one query, instant
// optimistic toggles everywhere). Writes go straight through the RLS-scoped
// browser client, mirroring report-button / contact-seller.
export function FavoritesProvider({
  initialUserId = null,
  initialIds = [],
  children,
}: {
  initialUserId?: string | null;
  initialIds?: string[];
  children: React.ReactNode;
}) {
  const t = useTranslations("favorites");
  const { openAuth } = useAuthSheet();
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const [ready, setReady] = useState(initialUserId != null);

  // Reload the saved set whenever auth changes (sign-in seeds it, sign-out clears
  // it). The initial paint is already seeded from the server for signed-in users.
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase.from("favorites").select("listing_id");
      setIds(new Set((data ?? []).map((r) => r.listing_id)));
      setReady(true);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        load();
      } else {
        setIds(new Set());
        setReady(true);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const has = useCallback((listingId: string) => ids.has(listingId), [ids]);

  const toggle = useCallback(
    async (listingId: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        openAuth();
        return;
      }

      const wasSaved = ids.has(listingId);
      // Optimistic flip — the heart fills/empties instantly.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(listingId);
        else next.add(listingId);
        return next;
      });

      const { error } = wasSaved
        ? await supabase
            .from("favorites")
            .delete()
            .eq("listing_id", listingId)
            .eq("user_id", user.id)
        : await supabase
            .from("favorites")
            .insert({ user_id: user.id, listing_id: listingId });

      if (error) {
        // Revert the optimistic change on failure.
        setIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        toast.error(t("error"));
      }
    },
    [ids, openAuth, t],
  );

  return (
    <FavoritesContext.Provider value={{ ready, has, toggle, count: ids.size }}>
      {children}
    </FavoritesContext.Provider>
  );
}
