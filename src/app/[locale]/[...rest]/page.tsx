import { notFound } from "next/navigation";

// Any URL that doesn't match a real route lands here and renders the localized
// not-found page (which lives inside the locale layout, so it keeps the site
// header/footer and translations) instead of the bare global 404.
export default function CatchAllNotFound() {
  notFound();
}
