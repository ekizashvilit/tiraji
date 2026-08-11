"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getSiteURL } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/auth-form-parts";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// "Forgot password" panel of the auth sheet. Sends a reset email. Email-only:
// phone-only accounts have a synthetic, non-deliverable address (see @/lib/phone)
// so they can't recover this way. Supabase never reveals whether an address
// exists, so on success we always show the same "check your email" confirmation.
export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  // Turnstile token is single-use; reset the widget after each attempt.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) {
      setFieldError(t("fieldRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError(t("invalidEmail"));
      return;
    }
    setFieldError(undefined);
    if (SITE_KEY && !captchaToken) {
      setFormError(t("captchaRequired"));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    // The email link lands home with ?auth=recovery, which reopens this sheet in
    // its "set a new password" panel — no dedicated page. Keep the user's locale
    // (as-needed prefix → English lives under /en).
    const next = locale === "en" ? "/en?auth=recovery" : "/?auth=recovery";
    const redirectTo = `${getSiteURL()}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.resetPasswordForEmail(value, {
      redirectTo,
      captchaToken: captchaToken ?? undefined,
    });
    setCaptchaToken(null);
    captchaRef.current?.reset();
    if (error) {
      setFormError(
        error.message.toLowerCase().includes("captcha")
          ? t("captchaRequired")
          : t("error"),
      );
      setLoading(false);
      return;
    }
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
          <p className="text-lg">{t("resetEmailSent")}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToSignIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 pr-8">
        <h2 className="text-xl font-bold">{t("forgotTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("forgotLede")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="reset-email">{t("emailLabel")}</Label>
          <Input
            id="reset-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? "reset-email-error" : undefined}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldError(undefined);
            }}
            placeholder={t("emailPlaceholder")}
          />
          <FieldError id="reset-email-error" message={fieldError} />
          <p className="text-xs text-muted-foreground">{t("forgotPhoneHint")}</p>
        </div>

        {SITE_KEY && (
          <Turnstile
            ref={captchaRef}
            siteKey={SITE_KEY}
            onSuccess={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
            options={{ theme: "auto", size: "flexible" }}
          />
        )}

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? t("pleaseWait") : t("sendResetLink")}
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToSignIn")}
      </button>
    </div>
  );
}
