"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function lari(price: number): string {
  return `₾${Number.isInteger(price) ? price : price.toFixed(2)}`;
}

type Suggestion = {
  id: string;
  title: string;
  author: string | null;
  listing_type: "sale" | "swap" | "giveaway";
  price: number | null;
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
  const boxRef = useRef<HTMLDivElement>(null);

  const query = q.trim();
  const active = open && query.length >= 2;

  // Debounced suggestion fetch.
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
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
    router.push(term ? `/buy?q=${encodeURIComponent(term)}` : "/buy");
  }

  function tag(s: Suggestion) {
    if (s.listing_type === "swap") return tc("swap");
    if (s.listing_type === "giveaway") return tc("free");
    return s.price != null ? lari(s.price) : "";
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
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          autoComplete="off"
          className="h-11 flex-1 bg-transparent px-4 text-[0.95rem] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label={t("searchButton")}
          className="grid w-12 place-items-center bg-brand-dark text-white transition-colors hover:bg-brand-dark/90"
        >
          <Search className="h-4.5 w-4.5" aria-hidden />
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
                    <Search
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
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
