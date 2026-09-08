import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { firago, notoGeorgian, notoSerifGeorgian } from "@/app/fonts";
import { PublicChrome } from "@/components/public-chrome";
import { Toaster } from "@/components/ui/sonner";
import { AuthSheetProvider } from "@/components/auth/auth-sheet";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ChatDockProvider } from "@/components/messages/chat-dock";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { createClient } from "@/lib/supabase/server";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "ტირაჟი — მეორადი წიგნები",
    template: "%s · ტირაჟი",
  },
  description:
    "Tiraji — buy, swap and give away second-hand, out-of-print and old books in Georgia.",
  // iOS Safari auto-links things that look like phone numbers/dates/addresses,
  // mutating the DOM before hydration and causing attribute mismatches. Disable it.
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

// Lock zoom to 1x so iOS never auto-zooms when a small (<16px) input is
// focused. Trade-off: this also disables pinch-to-zoom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  // Resolve auth on the server so the header's avatar renders on first paint —
  // no client-side placeholder flash when the tree remounts (e.g. locale switch).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let favoriteIds: string[] = [];
  if (user) {
    const [profileRes, favRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single(),
      supabase.from("favorites").select("listing_id"),
    ]);
    displayName = profileRes.data?.display_name ?? null;
    favoriteIds = (favRes.data ?? []).map((r) => r.listing_id);
  }

  const initialUser = user ? { email: user.email ?? null } : null;

  return (
    <html
      lang={locale}
      className={`${firago.variable} ${notoGeorgian.variable} ${notoSerifGeorgian.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>
          <ConfirmProvider>
            <AuthSheetProvider>
              <FavoritesProvider
                initialUserId={user?.id ?? null}
                initialIds={favoriteIds}
              >
                <ChatDockProvider>
                  <PublicChrome
                    initialUser={initialUser}
                    initialDisplayName={displayName}
                  >
                    {children}
                  </PublicChrome>
                </ChatDockProvider>
              </FavoritesProvider>
            </AuthSheetProvider>
          </ConfirmProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
