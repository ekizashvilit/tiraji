"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Presentational building blocks for the filter sidebar/sheet. Kept apart from
// SearchFilters so that component stays focused on URL/query-state wiring.

export function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function OptionRow({
  label,
  count,
  active,
  href,
}: {
  label: string;
  count?: number;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
        active && "font-semibold text-primary",
      )}
    >
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded border",
          active
            ? "border-primary bg-primary text-white"
            : "border-muted-foreground/40",
        )}
      >
        {active && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && (
        <span className="shrink-0 text-xs text-muted-foreground">{count}</span>
      )}
    </Link>
  );
}

export function PriceGroup({
  title,
  minLabel,
  maxLabel,
  applyLabel,
  min: initialMin,
  max: initialMax,
  onApply,
}: {
  title: string;
  minLabel: string;
  maxLabel: string;
  applyLabel: string;
  min: string;
  max: string;
  onApply: (min: string, max: string) => void;
}) {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);

  return (
    <div className="border-t border-border pt-4">
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApply(min, max);
        }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder={minLabel}
            aria-label={minLabel}
            className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder={maxLabel}
            aria-label={maxLabel}
            className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="h-10 w-full rounded-md bg-secondary px-3 text-sm font-semibold hover:bg-accent"
        >
          {applyLabel}
        </button>
      </form>
    </div>
  );
}
