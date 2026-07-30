import { setRequestLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/hero-search";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { BookShelf } from "@/components/book-shelf";
import { CategoryTiles } from "@/components/category-tiles";
import { WhyTiraji } from "@/components/home/why-tiraji";
import { HowItWorks } from "@/components/home/how-it-works";
import { PopularSearches } from "@/components/home/popular-searches";
import { getRecentListings, getListingsByType, getListingsByGenre } from "@/lib/listings";
import { getGenres } from "@/lib/genres";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	setRequestLocale(locale);

	const genres = await getGenres();
	const fictionId = genres.find((g) => g.slug === "fiction")?.id;
	const nonfictionId = genres.find((g) => g.slug === "nonfiction")?.id;

	const [recent, forSale, toSwap, free, fiction, nonfiction] = await Promise.all([
		getRecentListings(12),
		getListingsByType("sale", 12),
		getListingsByType("swap", 12),
		getListingsByType("giveaway", 12),
		fictionId ? getListingsByGenre(fictionId, 12) : Promise.resolve([]),
		nonfictionId ? getListingsByGenre(nonfictionId, 12) : Promise.resolve([]),
	]);

	const t = await getTranslations("home");

	return (
		<div>
			{/* Promotional banner slider */}
			<section className="mx-auto max-w-6xl px-4 pb-8">
				<HeroCarousel />
			</section>

			<section className="mx-auto max-w-6xl px-4 pb-14">
				<HeroSearch />
			</section>

			{/* Content */}
			<div className="mx-auto max-w-6xl space-y-14 px-4 pb-16">
				<BookShelf title={t("recentTitle")} href="/buy" listings={recent} accent="buy" priority />

				{/* Browse by category */}
				<section className="space-y-4">
					<h2 className="caps text-lg font-bold sm:text-xl">{t("categoriesTitle").toUpperCase()}</h2>
					<CategoryTiles genres={genres} locale={locale} />
				</section>

				<BookShelf title={t("forSaleTitle")} href="/buy" listings={forSale} accent="buy" />
				<BookShelf title={t("fictionShelf")} href="/search?genre=fiction" listings={fiction} accent="buy" />
				<BookShelf title={t("toSwapTitle")} href="/swap" listings={toSwap} accent="swap" />
				<BookShelf title={t("nonfictionShelf")} href="/search?genre=nonfiction" listings={nonfiction} accent="buy" />
				<BookShelf title={t("freeTitle")} href="/giveaway" listings={free} accent="give" />

				<WhyTiraji />
				<HowItWorks />
				<PopularSearches />

				{/* Email alert band */}
				<section className="flex flex-col items-start gap-4 rounded-xl border border-border bg-secondary px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
					<div className="max-w-lg">
						<h2 className="text-xl font-bold text-brand-dark">{t("alertTitle")}</h2>
						<p className="mt-2 text-muted-foreground">{t("alertDesc")}</p>
					</div>
					<Button asChild size="lg">
						<Link href="/buy">{t("alertCta")}</Link>
					</Button>
				</section>
			</div>
		</div>
	);
}
