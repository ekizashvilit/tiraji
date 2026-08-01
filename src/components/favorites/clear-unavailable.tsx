"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

// Saved books whose listing is no longer active (sold, hidden, or deleted) can't
// be shown — RLS hides non-active listings from non-owners. This clears those
// dangling favorites in one go. Deletes are RLS-scoped to the current user.
export function ClearUnavailable({
  ids,
  count,
}: {
  ids: string[];
  count: number;
}) {
  const t = useTranslations("favorites");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clear() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("favorites")
      .delete()
      .in("listing_id", ids);
    setBusy(false);
    if (error) {
      toast.error(t("error"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
      <span>{t("unavailableNote", { count })}</span>
      <Button variant="outline" size="sm" onClick={clear} disabled={busy}>
        {t("clearUnavailable")}
      </Button>
    </div>
  );
}
