import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { firago, notoGeorgian } from "@/app/fonts";
import { Providers } from "@/app/providers";
import { PublicChrome } from "@/components/public-chrome";
import { Toaster } from "@/components/ui/sonner";
import { AuthSheetProvider } from "@/components/auth/auth-sheet";
import { ChatDockProvider } from "@/components/messages/chat-dock";
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
  formatDetection: { telephone: false, date: false, address: false, email: false },
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
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = data?.display_name ?? null;
  }

  const initialUser = user ? { email: user.email ?? null } : null;

  return (
    <html
      lang={locale}
      className={`${firago.variable} ${notoGeorgian.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>
          <Providers>
            <AuthSheetProvider>
              <ChatDockProvider>
                <PublicChrome
                  initialUser={initialUser}
                  initialDisplayName={displayName}
                >
                  {children}
                </PublicChrome>
              </ChatDockProvider>
            </AuthSheetProvider>
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
