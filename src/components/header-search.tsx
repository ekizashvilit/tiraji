"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Loader2, Search, X } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ListingType } from "@/lib/supabase/types";
import { coverUrl, formatLari } from "@/lib/listings-format";
import { logSearch } from "@/lib/log-search";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: string;
  title: string;
  author: string | null;
  // Suggestions never include 'wanted' (search_listings excludes it), but the
  // RPC's row type is the full ListingType, so widen to match.
  listing_type: ListingType;
  price: number | null;
  cover: string | null;
};

export function HeaderSearch({ className }: { className?: string }) {
  const t = useTranslations("home");
  const tc = useTranslations("card");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Long, descriptive placeholder on desktop; just "Search" on mobile. Set in an
  // effect so the first client render matches the server (no hydration mismatch).
  const [placeholder, setPlaceholder] = useState(t("searchPlaceholder"));
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () =>
      setPlaceholder(mq.matches ? t("searchShort") : t("searchPlaceholder"));
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [t]);

  const query = q.trim();
  const active = open && query.length >= 2;

  // Debounced suggestion fetch. The loading flag and the sub-2-char reset are
  // both driven from the input's onChange handler, so this effect only ever
  // sets state asynchronously (never synchronously in its body, which would
  // cascade an extra render).
  useEffect(() => {
    if (query.length < 2) return;
    const handle = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("search_listings", {
        q: query,
        p_limit: 6,
      });
      setResults(
        (data ?? []).map((d) => ({
          id: d.id,
          title: d.title,
          author: d.author,
          listing_type: d.listing_type,
          price: d.price,
          cover: coverUrl(d),
        })),
      );
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goToSearch(term: string) {
    setOpen(false);
    if (term) logSearch(term);
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  }

  function tag(s: Suggestion) {
    if (s.listing_type === "swap") return tc("swap");
    if (s.listing_type === "giveaway") return tc("free");
    return s.price != null ? formatLari(s.price) : "";
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch(query);
        }}
        className="flex w-full items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-primary"
      >
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            setOpen(true);
            // Drive loading/reset from the event so the debounced fetch effect
            // never sets state synchronously. Below the 2-char minimum we clear
            // stale suggestions; at/above it we show the loading state until the
            // debounce resolves.
            const longEnough = value.trim().length >= 2;
            setLoading(longEnough);
            if (!longEnough) setResults(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label={t("searchPlaceholder")}
          autoComplete="off"
          className="h-8 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground md:h-9 md:px-4 md:text-[0.95rem] [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            aria-label={tCommon("clear")}
            onClick={() => {
              setQ("");
              setResults(null);
              setLoading(false);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="grid w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
        <button
          type="submit"
          aria-label={t("searchButton")}
          className="grid w-10 place-items-center bg-primary text-primary-foreground transition-colors hover:bg-primary/90 md:w-11"
        >
          <Search className="h-4 w-4 md:h-4.5 md:w-4.5" aria-hidden />
        </button>
      </form>

      {active && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {loading && results === null ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {tCommon("loading")}
            </div>
          ) : results && results.length > 0 ? (
            <ul className="max-h-96 overflow-auto py-1">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goToSearch(s.title)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent"
                  >
                    <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-secondary">
                      {s.cover ? (
                        <Image
                          src={s.cover}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-muted-foreground">
                          <Search className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {s.title}
                      </span>
                      {s.author && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {s.author}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {tag(s)}
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t border-border">
                <button
                  type="button"
                  onClick={() => goToSearch(query)}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-accent"
                >
                  {t("searchAll", { q: query })}
                </button>
              </li>
            </ul>
          ) : (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              {t("noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
