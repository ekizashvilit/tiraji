"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CheckCircle2, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { normalizeGeorgianPhone, phoneToEmail } from "@/lib/phone";
import { getSiteURL } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  PasswordInput,
  Segmented,
  GoogleIcon,
} from "@/components/auth/auth-form-parts";
import { FieldError } from "@/components/ui/field-error";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type Mode = "signin" | "register";
type Method = "phone" | "email";
// Which panel of the sheet is showing: the sign-in/register form, the
// forgot-password request, or the set-a-new-password step (recovery link).
export type AuthPanel = "auth" | "forgot" | "reset";

// Per-field validation messages; `form` covers whole-form errors (captcha,
// server responses) shown above the submit button.
type FieldErrors = {
  identifier?: string;
  password?: string;
  confirm?: string;
  form?: string;
};

const MIN_PASSWORD = 8;
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// The login/register form used inside the auth sheet. `onSuccess` fires after a
// successful sign-in/up so the caller can close the sheet. `initialPanel` lets
// the caller open straight into the password-recovery step (from an email link).
export function AuthForm({
  onSuccess,
  initialPanel = "auth",
}: {
  onSuccess?: () => void;
  initialPanel?: AuthPanel;
}) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [panel, setPanel] = useState<AuthPanel>(initialPanel);
  const [mode, setMode] = useState<Mode>("signin");
  const [method, setMethod] = useState<Method>("phone");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  // Cloudflare Turnstile: token is single-use, so we reset the widget after
  // every auth attempt to get a fresh one for the next try.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance>(null);
  function resetCaptcha() {
    setCaptchaToken(null);
    captchaRef.current?.reset();
  }

  function mapError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("already registered") || m.includes("already exists"))
      return t("alreadyRegistered");
    if (m.includes("invalid login") || m.includes("credentials"))
      return t("badCredentials");
    if (m.includes("captcha")) return t("captchaRequired");
    return t("error");
  }

  // Resolve the entered identifier to the email Supabase authenticates against.
  // Returns an `error` message (for the identifier field) when it's invalid.
  function resolveEmail():
    | { email: string; phone: string | null }
    | { error: string } {
    if (method === "phone") {
      const phone = normalizeGeorgianPhone(identifier);
      if (!phone) return { error: t("invalidPhone") };
      return { email: phoneToEmail(phone), phone };
    }
    const email = identifier.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { error: t("invalidEmail") };
    return { email, phone: null };
  }

  // When Turnstile is configured we require a token before hitting Supabase.
  function captchaOptions(): { captchaToken?: string } | "missing" {
    if (!SITE_KEY) return {};
    if (!captchaToken) return "missing";
    return { captchaToken };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate every field up front so each input can show its own message,
    // rather than bailing on the first problem or relying on native popups.
    const next: FieldErrors = {};
    let resolved: { email: string; phone: string | null } | null = null;

    if (!identifier.trim()) {
      next.identifier = t("fieldRequired");
    } else {
      const r = resolveEmail();
      if ("error" in r) next.identifier = r.error;
      else resolved = r;
    }

    if (!password) {
      next.password = t("fieldRequired");
    } else if (mode === "register" && password.length < MIN_PASSWORD) {
      next.password = t("weakPassword");
    }

    if (mode === "register") {
      if (!confirm) next.confirm = t("fieldRequired");
      else if (password && password !== confirm)
        next.confirm = t("passwordMismatch");
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    // resolved is guaranteed set here: identifier passed validation above.
    const { email, phone } = resolved!;

    const captcha = captchaOptions();
    if (captcha === "missing") {
      setErrors({ form: t("captchaRequired") });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getSiteURL()}/auth/callback`,
          data: phone ? { phone_number: phone } : {},
          ...captcha,
        },
      });
      resetCaptcha();
      if (error) {
        setErrors({ form: mapError(error.message) });
        setLoading(false);
        return;
      }
      // With email confirmation disabled, a session is returned immediately.
      if (!data.session) {
        setLoading(false);
        if (method === "email") setSent(true);
        else setErrors({ form: t("phoneSignupFailed") });
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { ...captcha },
      });
      resetCaptcha();
      if (error) {
        setErrors({ form: mapError(error.message) });
        setLoading(false);
        return;
      }
    }

    // Stay on the current page; refresh so server components pick up the session
    // (e.g. the header avatar), then let the caller close the sheet.
    router.refresh();
    onSuccess?.();
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${getSiteURL()}/auth/callback` },
    });
  }

  if (panel === "forgot") {
    return <ForgotPasswordForm onBack={() => setPanel("auth")} />;
  }

  if (panel === "reset") {
    return (
      <ResetPasswordForm
        onSuccess={onSuccess}
        onRequestNewLink={() => setPanel("forgot")}
      />
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
        <p className="text-lg">{t("checkEmail")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 pr-8">
        <h2 className="text-xl font-bold">
          {mode === "register" ? t("registerTitle") : t("signInTitle")}
        </h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {/* Phone / Email method */}
        <Segmented
          options={[
            { value: "phone", label: t("methodPhone") },
            { value: "email", label: t("methodEmail") },
          ]}
          value={method}
          onChange={(v) => {
            setMethod(v as Method);
            setIdentifier("");
            setErrors({});
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="identifier">
            {method === "phone" ? t("phoneLabel") : t("emailLabel")}
          </Label>
          <Input
            id="identifier"
            type={method === "phone" ? "tel" : "email"}
            inputMode={method === "phone" ? "tel" : "email"}
            autoComplete={method === "phone" ? "tel" : "email"}
            aria-invalid={!!errors.identifier}
            aria-describedby={errors.identifier ? "identifier-error" : undefined}
            value={identifier}
            onChange={(e) => {
              setIdentifier(
                method === "phone"
                  ? e.target.value.replace(/[^\d+ ]/g, "")
                  : e.target.value,
              );
              setErrors((prev) => ({ ...prev, identifier: undefined }));
            }}
            placeholder={
              method === "phone" ? t("phonePlaceholder") : t("emailPlaceholder")
            }
          />
          <FieldError id="identifier-error" message={errors.identifier} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <PasswordInput
            id="password"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            invalid={!!errors.password}
            describedBy={errors.password ? "password-error" : undefined}
            value={password}
            onChange={(v) => {
              setPassword(v);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />
          <FieldError id="password-error" message={errors.password} />
          {mode === "register" && !errors.password && (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          )}
          {mode === "signin" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setPanel("forgot");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("forgotPassword")}
              </button>
            </div>
          )}
        </div>

        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="confirm">{t("confirmLabel")}</Label>
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              invalid={!!errors.confirm}
              describedBy={errors.confirm ? "confirm-error" : undefined}
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              placeholder={t("confirmPlaceholder")}
            />
            <FieldError id="confirm-error" message={errors.confirm} />
          </div>
        )}

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

        {errors.form && (
          <p className="text-sm text-destructive">{errors.form}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading
            ? t("pleaseWait")
            : mode === "register"
              ? t("createAccount")
              : t("signInButton")}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {t("orContinueWith")}
        </span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={signInWithGoogle}
      >
        <GoogleIcon />
        {t("continueWithGoogle")}
      </Button>

      {/* Switch between signing in and creating an account */}
      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? t("noAccount") : t("haveAccount")}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "register" : "signin");
            setErrors({});
          }}
          className="font-semibold text-primary hover:underline"
        >
          {mode === "signin" ? t("tabRegister") : t("tabSignIn")}
        </button>
      </p>
    </div>
  );
}
