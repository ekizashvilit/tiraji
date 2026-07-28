import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Georgian is the primary audience; English is the secondary toggle.
  locales: ["ka", "en"],
  defaultLocale: "ka",
  // Georgian lives at "/", English at "/en".
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
