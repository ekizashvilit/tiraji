import type { BookCondition, ListingType } from "@/lib/supabase/types";

// The listing types a seller can create through the sell form. Excludes
// "wanted", which is posted via the separate wanted-board flow.
export const SELLABLE_TYPES: ListingType[] = ["sale", "swap", "giveaway"];

// Book conditions offered in the sell form, worst-to-best display order.
export const BOOK_CONDITIONS: BookCondition[] = [
  "new",
  "like_new",
  "good",
  "worn",
];
