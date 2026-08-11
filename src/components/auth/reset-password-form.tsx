"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError, PasswordInput } from "@/components/auth/auth-form-parts";

const MIN_PASSWORD = 8;

type Errors = { password?: string; confirm?: string; form?: string };

// "Set a new password" panel of the auth sheet. Reached when the reset email
// link lands home with ?auth=recovery: /auth/callback exchanges the recovery
// code into a session, then the sheet opens here. Without a session (link opened
// on another device, or expired) we show an "invalid link" state.
export function ResetPasswordForm({
  onSuccess,
  onRequestNewLink,
}: {
  onSuccess?: () => void;
  onRequestNewLink: () => void;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(
    "checking",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (active) setStatus(user ? "ready" : "invalid");
    })();
    return () => {
      active = false;
    };
  }, []);

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
    toast.success(t("passwordUpdated"));
    router.refresh();
    onSuccess?.();
  }

  if (status === "checking") {
    return (
      <div className="flex justify-center py-16">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-lg">{t("resetLinkInvalid")}</p>
        </div>
        <button
          type="button"
          onClick={onRequestNewLink}
          className="w-full text-sm font-medium text-primary hover:underline"
        >
          {t("requestNewLink")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 pr-8">
        <h2 className="text-xl font-bold">{t("resetTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("resetLede")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="new-password">{t("newPasswordLabel")}</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            invalid={!!errors.password}
            describedBy={errors.password ? "new-password-error" : undefined}
            value={password}
            onChange={(v) => {
              setPassword(v);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />
          <FieldError id="new-password-error" message={errors.password} />
          {!errors.password && (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t("confirmLabel")}</Label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            invalid={!!errors.confirm}
            describedBy={errors.confirm ? "confirm-password-error" : undefined}
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            placeholder={t("confirmPlaceholder")}
          />
          <FieldError id="confirm-password-error" message={errors.confirm} />
        </div>

        {errors.form && (
          <p className="text-sm text-destructive">{errors.form}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? t("pleaseWait") : t("updatePassword")}
        </Button>
      </form>
    </div>
  );
}
