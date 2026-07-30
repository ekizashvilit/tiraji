import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/listings";
import type { ListingType, ListingStatus } from "@/lib/supabase/types";

export type DayCount = { day: string; count: number };

export type DashboardStats = {
  users_total: number;
  users_7d: number;
  users_30d: number;
  listings_total: number;
  listings_active: number;
  listings_hidden: number;
  listings_closed: number;
  listings_sale: number;
  listings_swap: number;
  listings_giveaway: number;
  listings_today: number;
  listings_7d: number;
  listings_30d: number;
  conversations_total: number;
  messages_total: number;
  alerts_total: number;
  favorites_total: number;
  reports_total: number;
  listings_daily: DayCount[];
  users_daily: DayCount[];
};

// Aggregate stats for the admin dashboard (via a SECURITY DEFINER RPC that is
// itself admin-gated). Returns null if the RPC fails or the caller isn't admin.
export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error || !data) return null;
  return data as DashboardStats;
}

export const ADMIN_LISTINGS_PAGE_SIZE = 20;

export type AdminListing = {
  id: string;
  title: string;
  author: string | null;
  listing_type: ListingType;
  status: ListingStatus;
  price: number | null;
  is_negotiable: boolean;
  city: string | null;
  created_at: string;
  sellerName: string | null;
  cover: string | null;
};

type AdminListingRow = {
  id: string;
  title: string;
  author: string | null;
  listing_type: ListingType;
  status: ListingStatus;
  price: number | null;
  is_negotiable: boolean;
  city: string | null;
  created_at: string;
  seller_id: string;
  cover_image_paths: string[];
  cover_external_url: string | null;
};

// Every listing (any status), for the admin management table. RLS lets admins
// read all listings; the seller's display name is resolved from public_seller.
export async function getAdminListings(opts: {
  status?: string;
  type?: string;
  q?: string;
  day?: string;
  page?: number;
}): Promise<{ items: AdminListing[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * ADMIN_LISTINGS_PAGE_SIZE;

  let query = supabase
    .from("listings")
    .select(
      "id,title,author,listing_type,status,price,is_negotiable,city,created_at,seller_id,cover_image_paths,cover_external_url",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_LISTINGS_PAGE_SIZE - 1);

  if (opts.status && opts.status !== "all")
    query = query.eq("status", opts.status as ListingStatus);
  if (opts.type && opts.type !== "all")
    query = query.eq("listing_type", opts.type as ListingType);
  if (opts.q) query = query.ilike("title", `%${opts.q}%`);
  // A single calendar day: [day 00:00, next day 00:00) in UTC.
  if (opts.day && /^\d{4}-\d{2}-\d{2}$/.test(opts.day)) {
    const next = new Date(`${opts.day}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    query = query
      .gte("created_at", opts.day)
      .lt("created_at", next.toISOString().slice(0, 10));
  }

  const { data, count } = await query;
  const rows = (data as AdminListingRow[] | null) ?? [];

  // Batch-resolve seller names via the public view.
  const sellerIds = Array.from(new Set(rows.map((r) => r.seller_id)));
  const nameById = new Map<string, string | null>();
  if (sellerIds.length > 0) {
    const { data: people } = await supabase
      .from("public_seller")
      .select("id,display_name")
      .in("id", sellerIds);
    for (const p of (people as { id: string; display_name: string | null }[] | null) ??
      []) {
      nameById.set(p.id, p.display_name);
    }
  }

  const items: AdminListing[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    author: r.author,
    listing_type: r.listing_type,
    status: r.status,
    price: r.price,
    is_negotiable: r.is_negotiable,
    city: r.city,
    created_at: r.created_at,
    sellerName: nameById.get(r.seller_id)?.trim() || null,
    cover: coverUrl(r),
  }));

  return { items, total: count ?? 0 };
}
