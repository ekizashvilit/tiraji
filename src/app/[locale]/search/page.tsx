import { setRequestLocale, getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { BookGrid } from "@/components/book-grid";
import { SearchFilters } from "@/components/search/search-filters";
import { SortSelect } from "@/components/search/sort-select";
import { Pagination } from "@/components/search/pagination";
import { AlertsCta } from "@/components/alerts/alerts-cta";
import { searchListings, getListingFacets, PAGE_SIZE } from "@/lib/listings";
import { getGenres } from "@/lib/genres";
import type { ListingType, BookCondition } from "@/lib/supabase/types";

type SearchParams = {
  q?: string;
  author?: string;
  title?: string;
  type?: string;
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
  const tNav = await getTranslations("nav");
  const tAlerts = await getTranslations("alerts");

  const genres = await getGenres();

  // Filter groups are multi-select: values are comma-separated in the URL
  // (e.g. ?condition=new,like_new). Genres are readable slugs → resolve to ids.
  const list = (v?: string) => (v ? v.split(",").filter(Boolean) : undefined);
  const genreIds = list(sp.genre)
    ?.map((slug) => genres.find((g) => g.slug === slug)?.id)
    .filter((id): id is number => id != null);

  const filters = {
    q: sp.q,
    author: sp.author,
    title: sp.title,
    types: list(sp.type) as ListingType[] | undefined,
    conditions: list(sp.condition) as BookCondition[] | undefined,
    genres: genreIds?.length ? genreIds : undefined,
    cities: list(sp.city),
    languages: list(sp.language),
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
  };

  // A single term for the results header / empty state, whichever field the
  // user searched by. Alerts prefill a wanted-book title, so prefer title/keyword.
  const term = sp.q || sp.title || sp.author;
  const alertTitle = sp.title || sp.q;

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
        crumbs={[
          { label: tNav("home"), href: "/" },
          { label: t("searchResultsTitle") },
        ]}
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
                {term ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {tf("results", { count: facets.total })}
                    </span>{" "}
                    · {t("searchingFor", { query: term })}
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
              <div className="flex flex-col items-center gap-6 rounded-xl bg-card px-6 py-16 text-center">
                <SearchX
                  className="h-10 w-10 text-muted-foreground"
                  aria-hidden
                />
                <div>
                  <p className="max-w-sm text-muted-foreground">
                    {term
                      ? t("noResultsFor", { query: term })
                      : t("resultsSoon")}
                  </p>
                </div>
                {/* Send them to the alerts page, carrying the search term to
                    prefill. Logged-out users get the auth sheet in place. */}
                <AlertsCta
                  size="default"
                  href={
                    alertTitle
                      ? `/account/alerts?title=${encodeURIComponent(alertTitle)}`
                      : "/account/alerts"
                  }
                >
                  {tAlerts("searchCta")}
                </AlertsCta>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
