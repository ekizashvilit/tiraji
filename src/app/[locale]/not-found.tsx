"use client";

import { useTranslations } from "next-intl";
import { BookX } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

// Custom 404, shown inside the normal site chrome. Reached both by notFound()
// calls (e.g. a missing book) and by the [...rest] catch-all for unknown URLs.
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <div className="grid size-24 place-items-center rounded-full bg-secondary text-primary">
        <BookX className="size-11" aria-hidden />
      </div>
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("message")}</p>
      <Button asChild size="lg" className="mt-2">
        <Link href="/">{t("cta")}</Link>
      </Button>
    </div>
  );
}
