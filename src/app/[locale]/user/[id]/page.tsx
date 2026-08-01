import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";

import { getPublicProfile } from "@/lib/profiles";
import { getListingsBySeller } from "@/lib/listings";
import { cityLabel } from "@/lib/cities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookGrid } from "@/components/book-grid";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Params = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) return {};
  return { title: profile.display_name?.trim() || undefined };
}

export default async function UserProfilePage({ params }: Params) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const [t, tBook, tNav] = [
    await getTranslations("profile"),
    await getTranslations("book"),
    await getTranslations("nav"),
  ];
  const listings = await getListingsBySeller(id);

  const name = profile.display_name?.trim() || tBook("sellerFallback");
  const monthFmt = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "ka-GE",
    {
      month: "long",
      year: "numeric",
    },
  );
  const memberSince = monthFmt.format(new Date(profile.created_at));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[{ label: tNav("home"), href: "/" }, { label: name }]}
        className="mb-5"
      />

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-secondary text-xl text-brand-dark">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">{name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {profile.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {cityLabel(profile.city, locale)}
              </span>
            )}
            <span>{tBook("memberSince", { date: memberSince })}</span>
          </div>
        </div>
      </div>

      {/* Their listings */}
      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-bold">
          {t("booksTitle", { count: listings.length })}
        </h2>
        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <BookGrid listings={listings} />
        )}
      </section>
    </div>
  );
}
