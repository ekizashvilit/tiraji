import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Seller-uploaded covers live in this project's Supabase Storage bucket.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Allow the Cloudflare quick-tunnel domain to reach the dev server when
  // testing on a phone (`cloudflared tunnel --url http://localhost:3000`).
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      // Uploaded photos served from Supabase Storage (public covers bucket)
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Cover images (fallback when a seller uploads no photos)
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      // Georgian-language covers sourced from sulakauri.ge (demo seed only)
      { protocol: "https", hostname: "sulakauri.ge" },
    ],
  },
};

export default withNextIntl(nextConfig);
