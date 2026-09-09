import { cache } from "react";
import { unstable_cache } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { publicClient } from "@/lib/supabase/public";
import type {
  ListingType,
  BookCondition,
  ListingRow,
  GenreRow,
  PublicSellerRow,
} from "@/lib/supabase/types";
import { CARD_COLUMNS, type ListingCard } from "@/lib/listings-format";

// Client-safe presentation helpers live in listings-format so Client Components
// can import them too; re-exported here for the many server-side importers.
export {
  coverUrl,
  coverUrls,
  coverPathUrl,
  formatLari,
  CARD_COLUMNS,
  type ListingCard,
} from "@/lib/listings-format";

// The homepage shelves below are the same for every visitor, so they're cached
// across requests (see ./supabase/public for why an anon, cookie-less client is
// required inside `unstable_cache`). A short window keeps them near-fresh; the
// "listings" tag allows on-demand invalidation via `revalidateTag` if wanted.
const LISTINGS_REVALIDATE = 60;

export const getRecentListings = unstable_cache(
  async (limit = 12): Promise<ListingCard[]> => {
    const supabase = publicClient();
    const { data } = await supabase
      .from("listings")
      .select(CARD_COLUMNS)
      .eq("status", "active")
      .neq("listing_type", "wanted")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as ListingCard[]) ?? [];
  },
  ["recent-listings"],
  { revalidate: LISTINGS_REVALIDATE, tags: ["listings"] },
);

export const getListingsByType = unstable_cache(
  async (type: ListingType, limit = 12): Promise<ListingCard[]> => {
    const supabase = publicClient();
    const { data } = await supabase
      .from("listings")
      .select(CARD_COLUMNS)
      .eq("status", "active")
      .eq("listing_type", type)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as ListingCard[]) ?? [];
  },
  ["listings-by-type"],
  { revalidate: LISTINGS_REVALIDATE, tags: ["listings"] },
);

// A user's public (active) listings, for their profile page.
export async function getListingsBySeller(
  sellerId: string,
): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .neq("listing_type", "wanted")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  return (data as ListingCard[]) ?? [];
}

// The author with the most active listings, plus their books — for the dynamic
// "featured author" shelf on the homepage. Returns null if no author has at
// least two active listings (not worth a dedicated section).
export const getTopAuthorListings = unstable_cache(
  async (
    limit = 12,
  ): Promise<{ author: string; listings: ListingCard[] } | null> => {
    const supabase = publicClient();
    const { data: rows } = await supabase
      .from("listings")
      .select("author")
      .eq("status", "active")
      .neq("listing_type", "wanted")
      .not("author", "is", null);

    const counts = new Map<string, number>();
    for (const r of (rows as { author: string | null }[] | null) ?? []) {
      const a = (r.author ?? "").trim();
      if (a) counts.set(a, (counts.get(a) ?? 0) + 1);
    }

    let top: string | null = null;
    let max = 0;
    for (const [author, count] of counts) {
      if (count > max) {
        max = count;
        top = author;
      }
    }
    if (!top || max < 2) return null;

    const { data } = await supabase
      .from("listings")
      .select(CARD_COLUMNS)
      .eq("status", "active")
      .neq("listing_type", "wanted")
      .eq("author", top)
      .order("created_at", { ascending: false })
      .limit(limit);
    return { author: top, listings: (data as ListingCard[]) ?? [] };
  },
  ["top-author-listings"],
  { revalidate: LISTINGS_REVALIDATE, tags: ["listings"] },
);

// Cheap sale listings (fixed price at or under the cap) — for the homepage
// "Books under ₾X" shelf. Cheapest first.
export const getListingsUnderPrice = unstable_cache(
  async (maxPrice: number, limit = 12): Promise<ListingCard[]> => {
    const supabase = publicClient();
    const { data } = await supabase
      .from("listings")
      .select(CARD_COLUMNS)
      .eq("status", "active")
      .eq("listing_type", "sale")
      .eq("is_negotiable", false)
      .not("price", "is", null)
      .lte("price", maxPrice)
      .order("price", { ascending: true })
      .limit(limit);
    return (data as ListingCard[]) ?? [];
  },
  ["listings-under-price"],
  { revalidate: LISTINGS_REVALIDATE, tags: ["listings"] },
);

// A seller's other active listings (excluding the one being viewed) — for the
// "More from this seller" shelf on the detail page.
export async function getSellerOtherListings(
  sellerId: string,
  excludeId: string,
  limit = 12,
): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .neq("listing_type", "wanted")
    .eq("seller_id", sellerId)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ListingCard[]) ?? [];
}

// Related listings for the detail page: same genre when known (from other
// sellers, for variety), newest first. Falls back to recent when no genre.
export async function getSimilarListings(opts: {
  excludeId: string;
  genreId: number | null;
  excludeSellerId?: string;
  limit?: number;
}): Promise<ListingCard[]> {
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .neq("listing_type", "wanted")
    .neq("id", opts.excludeId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 12);
  if (opts.genreId != null) query = query.eq("genre_id", opts.genreId);
  if (opts.excludeSellerId)
    query = query.neq("seller_id", opts.excludeSellerId);
  const { data } = await query;
  return (data as ListingCard[]) ?? [];
}

export const getListingsByGenre = unstable_cache(
  async (genreId: number, limit = 12): Promise<ListingCard[]> => {
    const supabase = publicClient();
    const { data } = await supabase
      .from("listings")
      .select(CARD_COLUMNS)
      .eq("status", "active")
      .neq("listing_type", "wanted")
      .eq("genre_id", genreId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as ListingCard[]) ?? [];
  },
  ["listings-by-genre"],
  { revalidate: LISTINGS_REVALIDATE, tags: ["listings"] },
);

// Full listing for the SSR detail page, with its genre and the seller's public
// profile joined in. Wrapped in React `cache` so generateMetadata and the page
// component share a single set of queries per request. Visibility is enforced
// by RLS — a hidden/removed listing (or bad id) resolves to null.
export type ListingDetail = ListingRow & {
  genre: GenreRow | null;
  seller: PublicSellerRow | null;
};

export const getListingDetail = cache(
  async (id: string): Promise<ListingDetail | null> => {
    const supabase = await createClient();
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle<ListingRow>();
    if (!listing) return null;

    const [genreRes, sellerRes] = await Promise.all([
      listing.genre_id != null
        ? supabase
            .from("genres")
            .select("*")
            .eq("id", listing.genre_id)
            .maybeSingle<GenreRow>()
        : Promise.resolve({ data: null as GenreRow | null }),
      supabase
        .from("public_seller")
        .select("*")
        .eq("id", listing.seller_id)
        .maybeSingle<PublicSellerRow>(),
    ]);

    return {
      ...listing,
      genre: genreRes.data ?? null,
      seller: sellerRes.data ?? null,
    };
  },
);

// Listings shown per page on the browse/search grids. Divisible by the grid
// column counts (2/3/4/6) so the final row is always full.
export const PAGE_SIZE = 24;

// Filters shared by the search RPC and the facet-count RPC. Multi-value groups
// are arrays (OR within a group); price and hasPhoto are plain filters.
export type ListingFilters = {
  q?: string;
  // Field-scoped text search (homepage "Search for a book" box). `q` is the
  // general keyword; author/title match only their own column.
  author?: string;
  title?: string;
  types?: ListingType[];
  conditions?: BookCondition[];
  genres?: number[];
  languages?: string[];
  cities?: string[];
  minPrice?: number;
  maxPrice?: number;
  hasPhoto?: boolean;
};

// Search via the trigram RPC + filters (used by the browse/search pages).
export async function searchListings(
  params: ListingFilters & { sort?: string; limit?: number; offset?: number },
): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_listings", {
    q: params.q ?? null,
    // Only sent when used, so browse/keyword search stays compatible with the
    // pre-0013 RPC signature (author/title scoping needs migration 0013).
    ...(params.author ? { p_author: params.author } : {}),
    ...(params.title ? { p_title: params.title } : {}),
    p_types: params.types ?? null,
    p_conditions: params.conditions ?? null,
    p_languages: params.languages ?? null,
    p_cities: params.cities ?? null,
    p_genres: params.genres ?? null,
    p_min_price: params.minPrice ?? null,
    p_max_price: params.maxPrice ?? null,
    p_has_photo: params.hasPhoto ?? null,
    // Default to relevance when the user searched (best text match first),
    // otherwise newest first. Must mirror SortSelect's contextual default.
    p_sort: params.sort ?? (params.q ? "relevance" : "recent"),
    p_limit: params.limit ?? 48,
    p_offset: params.offset ?? 0,
  });
  return (data as ListingCard[]) ?? [];
}

// Facet counts across all active listings — used to build (and prune) the
// filter sidebar so we only ever show options that actually have books.
export type ListingFacets = {
  total: number;
  types: Record<string, number>;
  conditions: Record<string, number>;
  genres: Record<number, number>;
  cities: Record<string, number>;
  languages: Record<string, number>;
};

// Facet counts, computed entirely in the database via listing_facets(): each
// group is counted with all OTHER active filters applied but its own excluded
// (standard "exclude-self" faceting), so a group still shows the alternatives
// you could switch to. No row cap — counts stay correct at any scale.
export async function getListingFacets(
  f: ListingFilters = {},
): Promise<ListingFacets> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("listing_facets", {
    q: f.q ?? null,
    ...(f.author ? { p_author: f.author } : {}),
    ...(f.title ? { p_title: f.title } : {}),
    p_types: f.types ?? null,
    p_conditions: f.conditions ?? null,
    p_languages: f.languages ?? null,
    p_cities: f.cities ?? null,
    p_genres: f.genres ?? null,
    p_min_price: f.minPrice ?? null,
    p_max_price: f.maxPrice ?? null,
    p_has_photo: f.hasPhoto ?? null,
  });

  const empty: ListingFacets = {
    total: 0,
    types: {},
    conditions: {},
    genres: {},
    cities: {},
    languages: {},
  };
  return { ...empty, ...((data as Partial<ListingFacets> | null) ?? {}) };
}
