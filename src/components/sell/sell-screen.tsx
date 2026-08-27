"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { GenreRow, ListingType } from "@/lib/supabase/types";
import { PageHeader } from "@/components/page-header";
import { SellForm } from "@/components/sell/sell-form";

// Wraps the add-a-book heading + form so the page title tracks the selected
// type: "Post a request" for wanted, "Add a book" for the sellable types. The
// heading (rendered as the last breadcrumb) has to react to the client-side
// type switch, so it lives here rather than in the server page.
export function SellScreen({
  genres,
  defaultCity,
  defaultType,
}: {
  genres: GenreRow[];
  defaultCity: string;
  defaultType: ListingType;
}) {
  const t = useTranslations("pages");
  const tNav = useTranslations("nav");
  const [type, setType] = useState<ListingType>(defaultType);

  const title = type === "wanted" ? t("wantedPostTitle") : t("sellTitle");

  return (
    <>
      <PageHeader
        title={title}
        crumbs={[{ label: tNav("home"), href: "/" }, { label: title }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SellForm
          genres={genres}
          defaultCity={defaultCity}
          defaultType={defaultType}
          onTypeChange={setType}
        />
      </div>
    </>
  );
}
