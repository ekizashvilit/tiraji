"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Flag } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuthSheet } from "@/components/auth/auth-sheet";

// Minimal report flow: sign-in gated, asks for a reason, inserts a `reports`
// row for the admin queue. Kept lightweight — a full dialog can come later.
export function ReportButton({ listingId }: { listingId: string }) {
  const t = useTranslations("book");
  const { openAuth } = useAuthSheet();
  const [busy, setBusy] = useState(false);

  async function onReport() {
    if (busy) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      openAuth();
      return;
    }

    const reason = window.prompt(t("reportReason"));
    if (reason === null) return; // cancelled

    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      listing_id: listingId,
      reporter_id: user.id,
      reason: reason.trim() || null,
    });
    setBusy(false);

    if (error) {
      toast.error(t("reportError"));
      return;
    }
    toast.success(t("reported"));
  }

  return (
    <button
      type="button"
      onClick={onReport}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
    >
      <Flag className="size-4" aria-hidden />
      {t("report")}
    </button>
  );
}
