import type { BookCondition, ListingType } from "@/lib/supabase/types";

// The listing types the edit flow offers. Excludes "wanted" — wanted posts
// aren't editable through the sell form.
export const SELLABLE_TYPES: ListingType[] = ["sale", "swap", "giveaway"];

// Every type a user can create from scratch. The add-a-book form shows all
// four; "wanted" (a book you're looking for) adapts the form — no photos,
// condition or genre — and is offered only when creating, not editing.
export const CREATABLE_TYPES: ListingType[] = [
  "sale",
  "swap",
  "giveaway",
  "wanted",
];

// Book conditions offered in the sell form, worst-to-best display order.
export const BOOK_CONDITIONS: BookCondition[] = [
  "new",
  "like_new",
  "good",
  "worn",
];
