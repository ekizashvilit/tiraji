"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Presentational pieces of the auth form, split out so AuthForm itself stays
// focused on auth state, validation, and submission.

// Password input with a built-in show/hide toggle. Owns its own reveal state and
// pulls the toggle's aria-label from the shared auth strings, so every password
// field (sign in/up, reset, change password) looks and behaves identically.
// Caller still supplies the surrounding <Label>, hint, and <FieldError>.
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••",
  invalid,
  describedBy,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "new-password" | "current-password";
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  // Extra classes for the input (e.g. a shorter height to match a given form).
  className?: string;
}) {
  const t = useTranslations("auth");
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // Only the right padding for the show/hide button is field-specific; the
        // rest of the look comes from the shared Input default.
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? t("hidePassword") : t("showPassword")}
        className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
      >
        {show ? (
          <EyeOff className="h-5 w-5" aria-hidden />
        ) : (
          <Eye className="h-5 w-5" aria-hidden />
        )}
      </button>
    </div>
  );
}

// Two-way segmented toggle (phone / email method).
export function Segmented({
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

export function GoogleIcon() {
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
