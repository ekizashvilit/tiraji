"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { deleteMyAccount } from "@/lib/account-actions";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

// "Danger zone" at the bottom of the account page: lets a user permanently
// delete their own account. The server action removes the auth user (cascading
// all their data); we then sign the now-orphaned session out and go home.
export function DeleteAccount() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const confirm = useConfirm();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    if (
      !(await confirm({
        title: t("deleteConfirmTitle"),
        description: t("deleteConfirmBody"),
        confirmLabel: t("deleteButton"),
        cancelLabel: tc("cancel"),
        destructive: true,
      }))
    )
      return;

    setBusy(true);
    try {
      await deleteMyAccount();
      // The auth user is gone; clear the stale session cookie before leaving.
      await createClient().auth.signOut();
      toast.success(t("deleted"));
      router.push("/");
      router.refresh();
    } catch {
      toast.error(t("deleteError"));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <h2 className="font-semibold text-foreground">{t("deleteTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        {t("deleteHint")}
      </p>
      <Button
        variant="destructive"
        className="mt-4 gap-2"
        disabled={busy}
        onClick={onDelete}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-4" aria-hidden />
        )}
        {t("deleteButton")}
      </Button>
    </div>
  );
}
