// Pure, client-safe presentation helpers for listings and genres.
//
// These live apart from `@/lib/listings` and `@/lib/genres` on purpose: those
// modules import the server-only Supabase client (`next/headers`), so a Client
// Component can't import a *value* from them without pulling server code into
// the bundle. Keeping these dependency-free lets both the server and the
// browser share one implementation — no more hand-copied `lari()`/`genreName()`.
import type { GenreRow, ListingType } from "@/lib/supabase/types";

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

// Columns selected for a ListingCard. Shared by every card/shelf/grid query so
// the SELECT list and the type above can't drift apart.
export const CARD_COLUMNS =
  "id,title,author,price,is_negotiable,listing_type,city,cover_image_paths,cover_external_url";

// Public URL for a single uploaded cover file in the `covers` storage bucket.
export function coverPathUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}`;
}

type CoverSource = {
  cover_image_paths: string[];
  cover_external_url: string | null;
};

// Public URL for a listing's cover: first uploaded photo, else the external fallback.
export function coverUrl(listing: CoverSource): string | null {
  if (listing.cover_image_paths?.length) {
    return coverPathUrl(listing.cover_image_paths[0]);
  }
  return listing.cover_external_url ?? null;
}

// Public URLs for every one of a listing's photos (for the detail gallery).
// Uploaded photos win; otherwise the single external fallback, if any.
export function coverUrls(listing: CoverSource): string[] {
  if (listing.cover_image_paths?.length) {
    return listing.cover_image_paths.map(coverPathUrl);
  }
  return listing.cover_external_url ? [listing.cover_external_url] : [];
}

// Format a price in Georgian lari.
export function formatLari(price: number): string {
  const n = Number.isInteger(price) ? price : price.toFixed(2);
  return `₾${n}`;
}

// A genre's display name in the active locale.
export function genreName(genre: GenreRow, locale: string): string {
  return locale === "en" ? genre.name_en : genre.name_ka;
}
