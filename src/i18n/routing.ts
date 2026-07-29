import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Georgian is the primary audience; English is the secondary toggle.
  locales: ["ka", "en"],
  defaultLocale: "ka",
  // Georgian lives at "/", English at "/en".
  localePrefix: "as-needed",
  // Always land on Georgian; don't infer English from the browser's
  // Accept-Language. Visitors switch to English with the toggle (which sets
  // the NEXT_LOCALE cookie and is respected on later visits).
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
