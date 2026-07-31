import { getTranslations } from "next-intl/server";
import { BookMarked } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { BookGrid } from "@/components/book-grid";
import { SearchFilters } from "@/components/search/search-filters";
import { SortSelect } from "@/components/search/sort-select";
import { Pagination } from "@/components/search/pagination";
import { searchListings, getListingFacets, PAGE_SIZE } from "@/lib/listings";
import { getGenres } from "@/lib/genres";
import type { ListingType, BookCondition } from "@/lib/supabase/types";

export type BrowseSearchParams = {
  q?: string;
  genre?: string;
  city?: string;
  condition?: string;
  language?: string;
  min?: string;
  max?: string;
  photo?: string;
  sort?: string;
  page?: string;
};

// Shared browse page for /buy, /swap and /giveaway — a faceted results grid
// locked to one listing type. The type facet hides itself (only one option).
export async function BrowsePage({
  type,
  title,
  lede,
  accent,
  locale,
  searchParams,
}: {
  type: ListingType;
  title: string;
  lede: string;
  accent: "buy" | "swap" | "give";
  locale: string;
  searchParams: BrowseSearchParams;
}) {
  const t = await getTranslations("pages");
  const tf = await getTranslations("filters");
  const tNav = await getTranslations("nav");
  const sp = searchParams;
  const genres = await getGenres();

  // Shared filter set (type is fixed to this page) for both results and facet
  // counts. Other groups are multi-select: comma-separated values in the URL.
  // Genres are readable slugs (?genre=fiction) → resolve to ids.
  const list = (v?: string) => (v ? v.split(",").filter(Boolean) : undefined);
  const genreIds = list(sp.genre)
    ?.map((slug) => genres.find((g) => g.slug === slug)?.id)
    .filter((id): id is number => id != null);

  const filters = {
    q: sp.q,
    types: [type] as ListingType[],
    conditions: list(sp.condition) as BookCondition[] | undefined,
    genres: genreIds?.length ? genreIds : undefined,
    cities: list(sp.city),
    languages: list(sp.language),
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    hasPhoto: sp.photo === "1" ? true : undefined,
  };

  const page = Math.max(1, Number(sp.page) || 1);
  const [facets, listings] = await Promise.all([
    getListingFacets(filters),
    searchListings({
      ...filters,
      sort: sp.sort,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.ceil(facets.total / PAGE_SIZE);

  return (
    <>
      <PageHeader
        title={title}
        lede={lede}
        accent={accent}
        crumbs={[{ label: tNav("home"), href: "/" }, { label: title }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
          <aside className="lg:pr-2">
            <SearchFilters
              genres={genres}
              facets={facets}
              locale={locale}
              hideType
              resultCount={facets.total}
            />
          </aside>

          <div className="min-w-0">
            <div className="mb-5 hidden flex-wrap items-center justify-between gap-3 border-b border-border pb-4 lg:flex">
              <p className="text-sm text-muted-foreground">
                {sp.q ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {tf("results", { count: facets.total })}
                    </span>{" "}
                    · {t("searchingFor", { query: sp.q })}
                  </>
                ) : (
                  <span className="font-semibold text-foreground">
                    {tf("results", { count: facets.total })}
                  </span>
                )}
              </p>
              <SortSelect />
            </div>

            {listings.length > 0 ? (
              <>
                <BookGrid listings={listings} />
                <Pagination page={page} totalPages={totalPages} />
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
                <BookMarked
                  className="h-10 w-10 text-muted-foreground"
                  aria-hidden
                />
                <p className="max-w-sm text-muted-foreground">
                  {sp.q ? t("noResultsFor", { query: sp.q }) : t("resultsSoon")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
