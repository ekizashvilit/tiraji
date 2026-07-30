"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Page navigation for the browse/search grids. Builds hrefs that keep the
// current query (filters, sort) and only change `page`. Navigating scrolls to
// the top (Next's Link default), which is what you want when paging.
export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const t = useTranslations("common");
  const params = useSearchParams();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    if (p <= 1) sp.delete("page");
    else sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <nav
      aria-label={t("pagination")}
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      <Arrow href={href(page - 1)} disabled={page <= 1} label={t("prevPage")} dir="left" />

      {pageList(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span
            key={`gap-${i}`}
            className="grid size-9 place-items-center text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "grid size-9 place-items-center rounded-md border text-sm font-medium transition-colors",
              p === page
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-accent",
            )}
          >
            {p}
          </Link>
        ),
      )}

      <Arrow href={href(page + 1)} disabled={page >= totalPages} label={t("nextPage")} dir="right" />
    </nav>
  );
}

function Arrow({
  href,
  disabled,
  label,
  dir,
}: {
  href: string;
  disabled: boolean;
  label: string;
  dir: "left" | "right";
}) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  if (disabled) {
    return (
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground/40"
      >
        <Icon className="size-4.5" />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-9 place-items-center rounded-md border border-border text-foreground transition-colors hover:bg-accent"
    >
      <Icon className="size-4.5" />
    </Link>
  );
}

// A compact list of page numbers with ellipses: 1 … 4 5 6 … 20.
function pageList(current: number, total: number): (number | "...")[] {
  const range: (number | "...")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  range.push(total);
  return range;
}
