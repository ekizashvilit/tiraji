"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Structured search (Author / Title / Keyword) — combined into one query.
export function HeroSearch() {
  const t = useTranslations("home");
  const router = useRouter();
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Each field scopes to its own column: author→author, title→title,
    // keyword→general search. Only non-empty fields go into the URL.
    const params = new URLSearchParams();
    if (author.trim()) params.set("author", author.trim());
    if (title.trim()) params.set("title", title.trim());
    if (keyword.trim()) params.set("q", keyword.trim());
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  const fields = [
    {
      id: "author",
      label: t("fAuthor"),
      ph: t("fAuthorPh"),
      value: author,
      set: setAuthor,
    },
    {
      id: "title",
      label: t("fTitle"),
      ph: t("fTitlePh"),
      value: title,
      set: setTitle,
    },
    {
      id: "keyword",
      label: t("fKeyword"),
      ph: t("fKeywordPh"),
      value: keyword,
      set: setKeyword,
    },
  ];

  return (
    <div className="rounded-xl bg-secondary/60 p-6 sm:p-8">
      <h2 className="mb-5 text-2xl font-bold">{t("searchTitle")}</h2>
      <form
        onSubmit={onSubmit}
        className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
      >
        {fields.map((f) => (
          <div key={f.id} className="space-y-1.5">
            <Label htmlFor={f.id} className="text-sm font-bold">
              {f.label}
            </Label>
            <Input
              id={f.id}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.ph}
              className="h-12 rounded-md border-border bg-background"
            />
          </div>
        ))}
        <Button type="submit" size="lg" className="h-12 px-8">
          {t("searchButton")}
        </Button>
      </form>
    </div>
  );
}
