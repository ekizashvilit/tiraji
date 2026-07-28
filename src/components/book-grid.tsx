import { BookCard } from "@/components/book-card";
import type { ListingCard } from "@/lib/listings";

// Responsive grid of book cards (used on the browse/search pages).
export function BookGrid({ listings }: { listings: ListingCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {listings.map((listing) => (
        <BookCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
