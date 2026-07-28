"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function HeaderSearch({ className }: { className?: string }) {
  const t = useTranslations("home");
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/buy?q=${encodeURIComponent(query)}` : "/buy");
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-primary",
        className,
      )}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
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
  );
}
