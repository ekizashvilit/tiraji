import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/supabase/types";

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

// Search via the trigram RPC + filters (used by the browse pages).
export async function searchListings(params: {
  q?: string;
  type?: ListingType;
  city?: string;
  genre?: number;
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
    p_genre: params.genre ?? null,
    p_min_price: params.minPrice ?? null,
    p_max_price: params.maxPrice ?? null,
    p_sort: params.sort ?? "recent",
    p_limit: params.limit ?? 24,
    p_offset: params.offset ?? 0,
  });
  return (data as ListingCard[]) ?? [];
}
