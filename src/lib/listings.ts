import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  ListingType,
  BookCondition,
  ListingRow,
  GenreRow,
  PublicSellerRow,
} from "@/lib/supabase/types";

// Minimal shape used by cards/shelves/grids.
export type ListingCard = {
  id: string;
  title: string;
  author: string | null;
  price: number | null;
  is_negotiable: boolean;
  listing_type: ListingType;
  city: string | null;
  cover_image_paths: string[];
  cover_external_url: string | null;
};

const CARD_COLUMNS =
  "id,title,author,price,is_negotiable,listing_type,city,cover_image_paths,cover_external_url";

// Public URL for a listing's cover: first uploaded photo, else the external fallback.
export function coverUrl(listing: {
  cover_image_paths: string[];
  cover_external_url: string | null;
}): string | null {
  if (listing.cover_image_paths?.length) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${base}/storage/v1/object/public/covers/${listing.cover_image_paths[0]}`;
  }
  return listing.cover_external_url ?? null;
}

// Public URLs for every one of a listing's photos (for the detail gallery).
// Uploaded photos win; otherwise the single external fallback, if any.
export function coverUrls(listing: {
  cover_image_paths: string[];
  cover_external_url: string | null;
}): string[] {
  if (listing.cover_image_paths?.length) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return listing.cover_image_paths.map(
      (p) => `${base}/storage/v1/object/public/covers/${p}`,
    );
  }
  return listing.cover_external_url ? [listing.cover_external_url] : [];
}

// Format a price in Georgian lari.
export function formatLari(price: number): string {
  const n = Number.isInteger(price) ? price : price.toFixed(2);
  return `₾${n}`;
}

export async function getRecentListings(limit = 12): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ListingCard[]) ?? [];
}

export async function getListingsByType(
  type: ListingType,
  limit = 12,
): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .eq("listing_type", type)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ListingCard[]) ?? [];
}

// A user's public (active) listings, for their profile page.
export async function getListingsBySeller(
  sellerId: string,
): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  return (data as ListingCard[]) ?? [];
}

// The author with the most active listings, plus their books — for the dynamic
// "featured author" shelf on the homepage. Returns null if no author has at
// least two active listings (not worth a dedicated section).
export async function getTopAuthorListings(
  limit = 12,
): Promise<{ author: string; listings: ListingCard[] } | null> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("listings")
    .select("author")
    .eq("status", "active")
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
    .eq("author", top)
    .order("created_at", { ascending: false })
    .limit(limit);
  return { author: top, listings: (data as ListingCard[]) ?? [] };
}

// Cheap sale listings (fixed price at or under the cap) — for the homepage
// "Books under ₾X" shelf. Cheapest first.
export async function getListingsUnderPrice(
  maxPrice: number,
  limit = 12,
): Promise<ListingCard[]> {
  const supabase = await createClient();
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
}

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
    .neq("id", opts.excludeId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 12);
  if (opts.genreId != null) query = query.eq("genre_id", opts.genreId);
  if (opts.excludeSellerId) query = query.neq("seller_id", opts.excludeSellerId);
  const { data } = await query;
  return (data as ListingCard[]) ?? [];
}

export async function getListingsByGenre(
  genreId: number,
  limit = 12,
): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .eq("genre_id", genreId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ListingCard[]) ?? [];
}

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

// Search via the trigram RPC + filters (used by the browse pages).
export async function searchListings(params: {
  q?: string;
  type?: ListingType;
  city?: string;
  genre?: number;
  condition?: BookCondition;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<ListingCard[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_listings", {
    q: params.q ?? null,
    p_type: params.type ?? null,
    p_city: params.city ?? null,
    p_condition: params.condition ?? null,
    p_language: params.language ?? null,
    p_genre: params.genre ?? null,
    p_min_price: params.minPrice ?? null,
    p_max_price: params.maxPrice ?? null,
    p_sort: params.sort ?? "recent",
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

type FacetRow = {
  listing_type: string | null;
  condition: string | null;
  genre_id: number | null;
  city: string | null;
  book_language: string | null;
  price: number | null;
};

export type FacetFilters = {
  q?: string;
  type?: string;
  condition?: string;
  genre?: number;
  language?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
};

// Counts are computed over the books matching the current text query, then each
// facet is counted with all OTHER active filters applied but its own excluded —
// so a group still shows the alternatives you could switch to (standard faceting).
export async function getListingFacets(f: FacetFilters = {}): Promise<ListingFacets> {
  const supabase = await createClient();
  // Rows matching the text query only; structured filters are applied in JS below.
  const { data } = await supabase.rpc("search_listings", {
    q: f.q ?? null,
    p_type: null,
    p_city: null,
    p_condition: null,
    p_language: null,
    p_genre: null,
    p_min_price: null,
    p_max_price: null,
    p_sort: "recent",
    p_limit: 1000,
    p_offset: 0,
  });
  const rows = (data as FacetRow[]) ?? [];

  const inPrice = (price: number | null) => {
    if (f.minPrice == null && f.maxPrice == null) return true;
    if (price == null) return false;
    if (f.minPrice != null && price < f.minPrice) return false;
    if (f.maxPrice != null && price > f.maxPrice) return false;
    return true;
  };

  // Does a row pass every active filter except the named one?
  const passExcept = (r: FacetRow, except: string) => {
    if (except !== "type" && f.type && r.listing_type !== f.type) return false;
    if (except !== "condition" && f.condition && r.condition !== f.condition)
      return false;
    if (except !== "genre" && f.genre != null && r.genre_id !== f.genre)
      return false;
    if (except !== "language" && f.language && r.book_language !== f.language)
      return false;
    if (except !== "city" && f.city && r.city !== f.city) return false;
    if (except !== "price" && !inPrice(r.price)) return false;
    return true;
  };

  const facets: ListingFacets = {
    total: rows.filter((r) => passExcept(r, "none")).length,
    types: {},
    conditions: {},
    genres: {},
    cities: {},
    languages: {},
  };

  const bump = (map: Record<string, number>, key: string | null) => {
    if (key) map[key] = (map[key] ?? 0) + 1;
  };

  for (const r of rows) {
    if (passExcept(r, "type")) bump(facets.types, r.listing_type);
    if (passExcept(r, "condition")) bump(facets.conditions, r.condition);
    if (passExcept(r, "genre") && r.genre_id != null)
      facets.genres[r.genre_id] = (facets.genres[r.genre_id] ?? 0) + 1;
    if (passExcept(r, "language")) bump(facets.languages, r.book_language);
    if (passExcept(r, "city")) bump(facets.cities, r.city);
  }

  return facets;
}
