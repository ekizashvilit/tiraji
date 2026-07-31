"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpDown, Check, SlidersHorizontal, X } from "lucide-react";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { GenreRow } from "@/lib/supabase/types";
import type { ListingFacets } from "@/lib/listings";
import { languageLabel } from "@/lib/languages";
import { cityLabel } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { caps } from "@/lib/caps";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

// Inlined (can't import from @/lib/genres — it pulls in the server Supabase client).
function genreName(genre: GenreRow, locale: string): string {
  return locale === "en" ? genre.name_en : genre.name_ka;
}

type Props = {
  genres: GenreRow[];
  facets: ListingFacets;
  locale: string;
  // Hide the listing-type group (browse pages are already locked to one type).
  hideType?: boolean;
  // Result count, shown above the mobile controls bar.
  resultCount?: number;
};

const SORT_OPTIONS = [
  "recent",
  "relevance",
  "price_asc",
  "price_desc",
] as const;

// Keys the sidebar controls (everything except the text query and sort).
const FILTER_KEYS = [
  "type",
  "condition",
  "genre",
  "language",
  "city",
  "min",
  "max",
  "photo",
];

const SORT_LABEL_KEY: Record<string, string> = {
  recent: "sortRecent",
  relevance: "sortRelevance",
  price_asc: "sortPriceAsc",
  price_desc: "sortPriceDesc",
};

export function SearchFilters({
  genres,
  facets,
  locale,
  hideType = false,
  resultCount,
}: Props) {
  const t = useTranslations("filters");
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Sort default is contextual: relevance when there's a search query (best
  // match first), newest otherwise. Mirrors SortSelect and searchListings.
  const defaultSort = params.get("q") ? "relevance" : "recent";

  // Build a href that keeps the current params but overrides the given keys.
  function hrefWith(changes: Record<string, string | null>): string {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value == null || value === "") sp.delete(key);
      else sp.set(key, value);
    }
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // Multi-select groups store comma-separated values (e.g. ?condition=new,good).
  const valuesOf = (key: string) => {
    const v = params.get(key);
    return v ? v.split(",").filter(Boolean) : [];
  };
  // href that toggles one value in/out of a group (OR within the group).
  const toggleHref = (key: string, value: string) => {
    const set = new Set(valuesOf(key));
    if (set.has(value)) set.delete(value);
    else set.add(value);
    return hrefWith({ [key]: [...set].join(",") || null });
  };

  // Relevance sort only makes sense once there's a text query.
  const sortOptions = SORT_OPTIONS.filter(
    (o) => o !== "relevance" || params.get("q"),
  );

  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  // Only show a facet group when there's more than one option to choose between.
  const typeOptions = [
    { value: "sale", label: t("typeSale") },
    { value: "swap", label: t("typeSwap") },
    { value: "giveaway", label: t("typeGiveaway") },
  ].filter((o) => facets.types[o.value]);

  const conditionOptions = [
    { value: "new", label: t("condNew") },
    { value: "like_new", label: t("condLikeNew") },
    { value: "good", label: t("condGood") },
    { value: "worn", label: t("condWorn") },
  ].filter((o) => facets.conditions[o.value]);

  const genreOptions = genres.filter((g) => facets.genres[g.id]);
  const cityOptions = Object.keys(facets.cities).sort((a, b) =>
    cityLabel(a, locale).localeCompare(cityLabel(b, locale), locale),
  );
  const languageOptions = Object.keys(facets.languages).sort((a, b) =>
    languageLabel(a, locale).localeCompare(languageLabel(b, locale), locale),
  );

  // A group with only one available value adds no filtering power → hide it.
  const showType = !hideType && typeOptions.length > 1;
  const showCondition = conditionOptions.length > 1;
  const showGenre = genreOptions.length > 1;
  const showCity = cityOptions.length > 1;
  const showLanguage = languageOptions.length > 1;
  const showPrice = (facets.types.sale ?? 0) > 0;
  const showPhoto = facets.total > 0;

  const clearButton = activeCount > 0 && (
    <button
      type="button"
      onClick={() => {
        const sp = new URLSearchParams(params.toString());
        FILTER_KEYS.forEach((k) => sp.delete(k));
        const qs = sp.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      <X className="h-3.5 w-3.5" aria-hidden />
      {t("clear")}
    </button>
  );

  const groups = (
    <div className="space-y-6">
      {showType && (
          <Group title={t("type")}>
            <OptionRow
              label={t("any")}
              active={valuesOf("type").length === 0}
              href={hrefWith({ type: null })}
            />
            {typeOptions.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                count={facets.types[o.value]}
                active={valuesOf("type").includes(o.value)}
                href={toggleHref("type", o.value)}
              />
            ))}
          </Group>
        )}

        {showCondition && (
          <Group title={t("condition")}>
            <OptionRow
              label={t("any")}
              active={valuesOf("condition").length === 0}
              href={hrefWith({ condition: null })}
            />
            {conditionOptions.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                count={facets.conditions[o.value]}
                active={valuesOf("condition").includes(o.value)}
                href={toggleHref("condition", o.value)}
              />
            ))}
          </Group>
        )}

        {showPrice && (
          <PriceGroup
            // Remount when the URL price changes (e.g. "Clear") so the inputs re-seed.
            key={`${params.get("min") ?? ""}-${params.get("max") ?? ""}`}
            title={t("price")}
            minLabel={t("min")}
            maxLabel={t("max")}
            applyLabel={t("apply")}
            min={params.get("min") ?? ""}
            max={params.get("max") ?? ""}
            onApply={(min, max) => {
              // Guard against a reversed range (min 50, max 10) → swap so the
              // query returns the obvious intended band instead of nothing.
              let lo = min;
              let hi = max;
              if (lo && hi && Number(lo) > Number(hi)) [lo, hi] = [hi, lo];
              router.push(hrefWith({ min: lo, max: hi }));
            }}
          />
        )}

        {showGenre && (
          <Group title={t("genre")}>
            <OptionRow
              label={t("any")}
              active={valuesOf("genre").length === 0}
              href={hrefWith({ genre: null })}
            />
            {genreOptions.map((g) => (
              <OptionRow
                key={g.id}
                label={genreName(g, locale)}
                count={facets.genres[g.id]}
                active={valuesOf("genre").includes(g.slug)}
                href={toggleHref("genre", g.slug)}
              />
            ))}
          </Group>
        )}

        {showLanguage && (
          <Group title={t("language")}>
            <OptionRow
              label={t("any")}
              active={valuesOf("language").length === 0}
              href={hrefWith({ language: null })}
            />
            {languageOptions.map((l) => (
              <OptionRow
                key={l}
                label={languageLabel(l, locale)}
                count={facets.languages[l]}
                active={valuesOf("language").includes(l)}
                href={toggleHref("language", l)}
              />
            ))}
          </Group>
        )}

        {showCity && (
          <Group title={t("city")}>
            <OptionRow
              label={t("any")}
              active={valuesOf("city").length === 0}
              href={hrefWith({ city: null })}
            />
            {cityOptions.map((c) => (
              <OptionRow
                key={c}
                label={cityLabel(c, locale)}
                count={facets.cities[c]}
                active={valuesOf("city").includes(c)}
                href={toggleHref("city", c)}
              />
            ))}
          </Group>
        )}

        {showPhoto && (
          <Group title={t("photo")}>
            <OptionRow
              label={t("hasPhoto")}
              active={params.get("photo") === "1"}
              href={hrefWith({ photo: params.get("photo") === "1" ? null : "1" })}
            />
          </Group>
        )}
    </div>
  );

  return (
    <div>
      {/* Mobile controls: result count + a split Filters / Sort bar. */}
      <div className="mb-4 lg:hidden">
        {resultCount != null && (
          <p className="mb-2.5 text-sm font-semibold">
            {t("results", { count: resultCount })}
          </p>
        )}
        <div className="grid grid-cols-2 divide-x divide-border overflow-hidden rounded-lg border border-border bg-card">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 py-3 text-sm font-semibold hover:bg-accent"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {t("title")}
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>
          <div className="relative">
            {/* Centered visual (icon + current sort); the native select sits on
                top, transparent, so the mobile picker still opens. */}
            <div className="pointer-events-none flex items-center justify-center gap-2 py-3 text-sm font-semibold">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden />
              {t(SORT_LABEL_KEY[params.get("sort") ?? defaultSort])}
            </div>
            <select
              value={params.get("sort") ?? defaultSort}
              onChange={(e) => {
                const sp = new URLSearchParams(params.toString());
                if (e.target.value === defaultSort) sp.delete("sort");
                else sp.set("sort", e.target.value);
                const qs = sp.toString();
                router.push(qs ? `${pathname}?${qs}` : pathname);
              }}
              aria-label={t("sortBy")}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              {sortOptions.map((o) => (
                <option key={o} value={o}>
                  {t(SORT_LABEL_KEY[o])}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="caps text-sm font-bold">{caps(t("title"))}</h2>
          {clearButton}
        </div>
        {groups}
      </div>

      {/* Mobile bottom sheet — opens from the Filters button, sized to content
          up to 70% of the screen. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showClose={false}
          className="flex max-h-[70vh] flex-col gap-0 rounded-t-2xl p-0 lg:hidden"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <SheetTitle className="caps text-sm font-bold">
              {caps(t("title"))}
            </SheetTitle>
            <div className="flex items-center gap-4">
              {clearButton}
              <SheetClose
                aria-label={t("close")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden />
              </SheetClose>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{groups}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function OptionRow({
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

function PriceGroup({
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
