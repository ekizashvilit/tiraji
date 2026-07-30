"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";

// Title search for the admin listings table. Preserves the other query params
// (status/type filters) and resets to page 1 on a new search.
export function AdminSearch({ placeholder }: { placeholder: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams(params.toString());
    if (q.trim()) sp.set("q", q.trim());
    else sp.delete("q");
    sp.delete("page");
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full items-stretch overflow-hidden rounded-lg border border-input bg-background focus-within:border-primary sm:max-w-sm"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        aria-label={placeholder}
        className="grid w-11 place-items-center bg-brand-dark text-white transition-colors hover:bg-brand-dark/90"
      >
        <Search className="size-4" aria-hidden />
      </button>
    </form>
  );
}
