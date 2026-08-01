"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Report flow: sign-in gated, asks for an optional reason via an accessible
// dialog (focus-trapped, Esc to close), then inserts a `reports` row for the
// admin queue.
export function ReportButton({ listingId }: { listingId: string }) {
  const t = useTranslations("book");
  const tc = useTranslations("common");
  const { openAuth } = useAuthSheet();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function onOpen() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      openAuth();
      return;
    }
    setReason("");
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setOpen(false);
      openAuth();
      return;
    }
    const { error } = await supabase.from("reports").insert({
      listing_id: listingId,
      reporter_id: user.id,
      reason: reason.trim() || null,
    });
    setBusy(false);
    setOpen(false);
    if (error) {
      toast.error(t("reportError"));
      return;
    }
    toast.success(t("reported"));
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
      >
        <Flag className="size-4" aria-hidden />
        {t("report")}
      </button>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <form onSubmit={onSubmit} className="space-y-4">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {t("report")}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {t("reportReason")}
            </Dialog.Description>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="sm">
                  {tc("cancel")}
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={busy}
                className="gap-1.5"
              >
                {busy && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                {t("report")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
