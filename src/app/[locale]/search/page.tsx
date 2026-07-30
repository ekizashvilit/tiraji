import { setRequestLocale, getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { BookGrid } from "@/components/book-grid";
import { SearchFilters } from "@/components/search/search-filters";
import { SortSelect } from "@/components/search/sort-select";
import { Pagination } from "@/components/search/pagination";
import { searchListings, getListingFacets, PAGE_SIZE } from "@/lib/listings";
import { getGenres } from "@/lib/genres";
import type { ListingType, BookCondition } from "@/lib/supabase/types";

type SearchParams = {
  q?: string;
  type?: string;
  genre?: string;
  city?: string;
  condition?: string;
  language?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("pages");
  const tf = await getTranslations("filters");

  const genres = await getGenres();

  // Shared filter set for both the results query and the facet counts.
  // The genre is a readable slug in the URL (e.g. ?genre=fiction) → resolve to its id.
  const filters = {
    q: sp.q,
    type: (sp.type as ListingType) || undefined,
    genre: genres.find((g) => g.slug === sp.genre)?.id,
    city: sp.city,
    condition: (sp.condition as BookCondition) || undefined,
    language: sp.language,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
  };

  const page = Math.max(1, Number(sp.page) || 1);
  const [facets, listings] = await Promise.all([
    // Facets reflect the current query + other active filters (exclude-self).
    getListingFacets(filters),
    // No default type filter — search across Sale, Swap and Give away.
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
        title={t("searchResultsTitle")}
        lede={t("searchResultsLede")}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
          <aside className="lg:pr-2">
            <SearchFilters
              genres={genres}
              facets={facets}
              locale={locale}
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
                <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />
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
