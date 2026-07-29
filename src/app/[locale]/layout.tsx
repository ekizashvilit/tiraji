import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { firago, notoGeorgian } from "@/app/fonts";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthSheetProvider } from "@/components/auth/auth-sheet";
import { createClient } from "@/lib/supabase/server";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "ტირაჟი — მეორადი წიგნები",
    template: "%s · ტირაჟი",
  },
  description:
    "Tiraji — buy, swap and give away second-hand, out-of-print and old books in Georgia.",
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
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <Providers>
            <AuthSheetProvider>
              <SiteHeader
                initialUser={initialUser}
                initialDisplayName={displayName}
              />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </AuthSheetProvider>
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
