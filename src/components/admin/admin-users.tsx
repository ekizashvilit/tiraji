"use client";

import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";
import { toast } from "sonner";
import {
  Ban,
  Check,
  Copy,
  KeyRound,
  Loader2,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import {
  setUserBanned,
  deleteUser,
  resetUserPassword,
} from "@/lib/admin-actions";
import type { AdminUser } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

export function AdminUsers({
  items,
  meId,
}: {
  items: AdminUser[];
  meId: string;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  // The generated temp password to show after a reset (dialog is open while set).
  const [reset, setReset] = useState<{ name: string; password: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dayFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const utcKey = (offset: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - offset);
    return d.toISOString().slice(0, 10);
  };
  const todayKey = utcKey(0);
  const yesterdayKey = utcKey(1);
  const dayLabel = (key: string) => {
    if (key === todayKey) return t("today");
    if (key === yesterdayKey) return t("yesterday");
    return dayFmt.format(new Date(`${key}T00:00:00Z`));
  };

  async function toggleBan(user: AdminUser) {
    const next = !user.banned;
    if (
      next &&
      !(await confirm({
        title: t("banConfirm"),
        confirmLabel: t("ban"),
        cancelLabel: tc("cancel"),
        destructive: true,
      }))
    )
      return;
    setBusyId(user.id);
    try {
      await setUserBanned(user.id, next);
      toast.success(next ? t("banned") : t("unbanned"));
      router.refresh();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(user: AdminUser) {
    const name = user.displayName || t("unnamedUser");
    if (
      !(await confirm({
        title: t("resetPasswordConfirm"),
        description: t("resetPasswordConfirmBody"),
        confirmLabel: t("resetPassword"),
        cancelLabel: tc("cancel"),
      }))
    )
      return;
    setBusyId(user.id);
    try {
      const password = await resetUserPassword(user.id);
      setCopied(false);
      setReset({ name, password });
    } catch {
      toast.error(t("actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function copyPassword() {
    if (!reset) return;
    try {
      await navigator.clipboard.writeText(reset.password);
      setCopied(true);
    } catch {
      toast.error(t("actionError"));
    }
  }

  async function remove(user: AdminUser) {
    if (
      !(await confirm({
        title: t("userDeleteConfirm"),
        confirmLabel: tc("delete"),
        cancelLabel: tc("cancel"),
        destructive: true,
      }))
    )
      return;
    setBusyId(user.id);
    try {
      await deleteUser(user.id);
      toast.success(t("userDeleted"));
      router.refresh();
    } catch {
      toast.error(t("actionError"));
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-10 text-center text-sm text-muted-foreground">
        {t("noUsers")}
      </p>
    );
  }

  return (
    <>
    <ul className="space-y-3">
      {items.map((user, i) => {
        const busy = busyId === user.id;
        const isSelf = user.id === meId;
        const dayKey = user.created_at.slice(0, 10);
        const prevKey = i > 0 ? items[i - 1].created_at.slice(0, 10) : null;
        const name = user.displayName || t("unnamedUser");
        return (
          <Fragment key={user.id}>
            {dayKey !== prevKey && (
              <li className="pt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground first:pt-0">
                {dayLabel(dayKey)}
              </li>
            )}
            <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 sm:flex-nowrap">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                <UserRound className="size-5" aria-hidden />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{name}</span>
                  {user.isAdmin && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      <ShieldCheck className="size-3" aria-hidden />
                      {t("adminBadge")}
                    </span>
                  )}
                  {user.banned && (
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                      {t("bannedBadge")}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email || user.phone || t("noContact")}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {user.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" aria-hidden />
                      {user.city}
                    </span>
                  )}
                  <span>{t("listingCount", { count: user.listingCount })}</span>
                  <span>
                    ·{" "}
                    {t("joined", {
                      date: dateFmt.format(new Date(user.created_at)),
                    })}
                  </span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("gap-1.5", user.banned && "text-buy")}
                  disabled={busy || isSelf}
                  onClick={() => toggleBan(user)}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : user.banned ? (
                    <RotateCcw className="size-4" aria-hidden />
                  ) : (
                    <Ban className="size-4" aria-hidden />
                  )}
                  {user.banned ? t("unban") : t("ban")}
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("resetPassword")}
                  title={t("resetPassword")}
                  disabled={busy || isSelf}
                  onClick={() => resetPassword(user)}
                >
                  <KeyRound className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label={t("deleteUser")}
                  disabled={busy || isSelf}
                  onClick={() => remove(user)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          </Fragment>
        );
      })}
    </ul>

      <AlertDialog.Root
        open={!!reset}
        onOpenChange={(next) => {
          if (!next) setReset(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <AlertDialog.Title className="text-lg font-semibold text-foreground">
              {t("resetPasswordDone")}
            </AlertDialog.Title>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
              <code className="flex-1 select-all px-2 font-mono text-lg tracking-wide text-foreground">
                {reset?.password}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={copyPassword}
              >
                {copied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied ? t("copied") : t("copyPassword")}
              </Button>
            </div>

            <AlertDialog.Description className="mt-3 text-sm text-muted-foreground">
              {t("resetPasswordHint", { name: reset?.name ?? "" })}
            </AlertDialog.Description>

            <div className="mt-6 flex justify-end">
              <AlertDialog.Action asChild>
                <Button size="sm">{tc("close")}</Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
