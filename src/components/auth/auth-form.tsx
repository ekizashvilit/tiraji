"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { normalizeGeorgianPhone, phoneToEmail } from "@/lib/phone";
import { getSiteURL } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Mode = "signin" | "register";
type Method = "phone" | "email";

const MIN_PASSWORD = 8;
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// The login/register form used inside the auth sheet. `onSuccess` fires after a
// successful sign-in/up so the caller can close the sheet.
export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [method, setMethod] = useState<Method>("phone");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  // Returns null (and sets an error) when the input is invalid.
  function resolveEmail(): { email: string; phone: string | null } | null {
    if (method === "phone") {
      const phone = normalizeGeorgianPhone(identifier);
      if (!phone) {
        setError(t("invalidPhone"));
        return null;
      }
      return { email: phoneToEmail(phone), phone };
    }
    const email = identifier.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("invalidEmail"));
      return null;
    }
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
    setError(null);

    const resolved = resolveEmail();
    if (!resolved) return;
    const { email, phone } = resolved;

    if (mode === "register") {
      if (password.length < MIN_PASSWORD) {
        setError(t("weakPassword"));
        return;
      }
      if (password !== confirm) {
        setError(t("passwordMismatch"));
        return;
      }
    }

    const captcha = captchaOptions();
    if (captcha === "missing") {
      setError(t("captchaRequired"));
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
        setError(mapError(error.message));
        setLoading(false);
        return;
      }
      // With email confirmation disabled, a session is returned immediately.
      if (!data.session) {
        setLoading(false);
        if (method === "email") setSent(true);
        else setError(t("phoneSignupFailed"));
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
        setError(mapError(error.message));
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
        <p className="text-sm text-muted-foreground">{t("loginLede")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
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
            setError(null);
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
            required
            value={identifier}
            onChange={(e) =>
              setIdentifier(
                method === "phone"
                  ? e.target.value.replace(/[^\d+ ]/g, "")
                  : e.target.value,
              )
            }
            placeholder={
              method === "phone" ? t("phonePlaceholder") : t("emailPlaceholder")
            }
            className="h-12 bg-background text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              className="h-12 bg-background pr-12 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t("hidePassword") : t("showPassword")}
              className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
            >
              {showPw ? (
                <EyeOff className="h-5 w-5" aria-hidden />
              ) : (
                <Eye className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
          {mode === "register" && (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          )}
        </div>

        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="confirm">{t("confirmLabel")}</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("confirmPlaceholder")}
                className="h-12 bg-background pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
                className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? (
                  <EyeOff className="h-5 w-5" aria-hidden />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
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

        {error && <p className="text-sm text-destructive">{error}</p>}

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
            setError(null);
          }}
          className="font-semibold text-primary hover:underline"
        >
          {mode === "signin" ? t("tabRegister") : t("tabSignIn")}
        </button>
      </p>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-10 rounded-md text-sm font-semibold transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
