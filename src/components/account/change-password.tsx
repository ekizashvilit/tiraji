"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError, PasswordInput } from "@/components/auth/auth-form-parts";

const MIN_PASSWORD = 8;

type Errors = { password?: string; confirm?: string; form?: string };

// Account-page "Change password" card. Lets a signed-in user set a new password —
// notably the path for someone an admin reset to a temporary one, and for phone
// accounts that can't use the email-based self-serve reset. Field strings are
// shared with the auth sheet (the "auth" namespace); the section chrome is
// "account". Reuses the current session, so no current-password re-entry.
export function ChangePassword() {
  const t = useTranslations("auth");
  const ta = useTranslations("account");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const next: Errors = {};
    if (!password) next.password = t("fieldRequired");
    else if (password.length < MIN_PASSWORD) next.password = t("weakPassword");
    if (!confirm) next.confirm = t("fieldRequired");
    else if (password && password !== confirm)
      next.confirm = t("passwordMismatch");
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrors({ form: t("error") });
      setLoading(false);
      return;
    }
    setPassword("");
    setConfirm("");
    setLoading(false);
    toast.success(t("passwordUpdated"));
  }

  return (
    <div className="border-t border-border pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
      <h2 className="font-semibold text-foreground">{ta("passwordTitle")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        {ta("passwordLede")}
      </p>

      <form onSubmit={onSubmit} className="mt-4 max-w-xl space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="account-new-password">{t("newPasswordLabel")}</Label>
          <PasswordInput
            id="account-new-password"
            autoComplete="new-password"
            invalid={!!errors.password}
            describedBy={
              errors.password ? "account-new-password-error" : undefined
            }
            value={password}
            onChange={(v) => {
              setPassword(v);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />
          <FieldError
            id="account-new-password-error"
            message={errors.password}
          />
          {!errors.password && (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-confirm-password">{t("confirmLabel")}</Label>
          <PasswordInput
            id="account-confirm-password"
            autoComplete="new-password"
            invalid={!!errors.confirm}
            describedBy={
              errors.confirm ? "account-confirm-password-error" : undefined
            }
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            placeholder={t("confirmPlaceholder")}
          />
          <FieldError
            id="account-confirm-password-error"
            message={errors.confirm}
          />
        </div>

        {errors.form && (
          <p className="text-sm text-destructive">{errors.form}</p>
        )}

        <Button type="submit" className="gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <KeyRound className="size-4" aria-hidden />
          )}
          {loading ? t("pleaseWait") : t("updatePassword")}
        </Button>
      </form>
    </div>
  );
}
