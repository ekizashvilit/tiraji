import type { MetadataRoute } from "next";

// Crawl policy. The filter sidebar builds faceted query-param URLs
// (city × genre × condition × price × sort), which multiply into a near-infinite
// crawl space — a "crawler trap" that lets bots hammer SSR pages (and, before
// covers were served directly, image optimization) millions of times. We let
// crawlers index clean listing/browse/detail pages but disallow any URL with a
// query string, plus the private, per-user areas that shouldn't be indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*?", // faceted filter / sort / search query URLs (crawler trap)
          "/account",
          "/messages",
          "/my-listings",
          "/saved",
          "/admin",
        ],
      },
    ],
  };
}
