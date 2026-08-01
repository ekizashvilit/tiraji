import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { getListingDetail, getSellerOtherListings, getSimilarListings, coverUrls, formatLari } from "@/lib/listings";
import { spineFor } from "@/lib/spine";
import { caps } from "@/lib/caps";
import { BookShelf } from "@/components/book-shelf";
import { genreName } from "@/lib/genres";
import { cityLabel } from "@/lib/cities";
import { languageLabel } from "@/lib/languages";
import type { ListingType, BookCondition } from "@/lib/supabase/types";
import { BookGallery } from "@/components/book/book-gallery";
import { ContactSeller } from "@/components/book/contact-seller";
import { ReportButton } from "@/components/book/report-button";

type Params = { params: Promise<{ locale: string; id: string }> };

// Which browse page a listing belongs to, plus its accent colour + type label.
const SECTION: Record<ListingType, { href: string; navKey: string; typeKey: string; pill: string }> = {
	sale: { href: "/buy", navKey: "buy", typeKey: "typeSale", pill: "bg-buy/10 text-buy" },
	swap: { href: "/swap", navKey: "swap", typeKey: "typeSwap", pill: "bg-swap/10 text-swap" },
	giveaway: {
		href: "/giveaway",
		navKey: "giveaway",
		typeKey: "typeGiveaway",
		pill: "bg-give/10 text-give",
	},
	wanted: {
		href: "/wanted",
		navKey: "wanted",
		typeKey: "typeWanted",
		pill: "bg-primary/10 text-primary",
	},
};

const CONDITION_KEY: Record<BookCondition, string> = {
	new: "condNew",
	like_new: "condLikeNew",
	good: "condGood",
	worn: "condWorn",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { id } = await params;
	const listing = await getListingDetail(id);
	if (!listing) return {};

	const images = coverUrls(listing);
	const description = listing.description?.slice(0, 160) || [listing.title, listing.author].filter(Boolean).join(" — ");

	return {
		title: listing.title,
		description,
		openGraph: {
			title: listing.title,
			description,
			type: "website",
			images: images.length ? [{ url: images[0] }] : undefined,
		},
	};
}

export default async function BookPage({ params }: Params) {
	const { locale, id } = await params;
	setRequestLocale(locale);

	const listing = await getListingDetail(id);
	if (!listing) notFound();

	const t = await getTranslations("book");
	const tNav = await getTranslations("nav");
	const tf = await getTranslations("filters");
	const tCard = await getTranslations("card");

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const isOwner = !!user && user.id === listing.seller_id;

	// Related shelves to fill out the page: the seller's other books, and similar
	// books (same genre, other sellers).
	const [sellerOther, similar] = await Promise.all([
		getSellerOtherListings(listing.seller_id, listing.id, 12),
		getSimilarListings({
			excludeId: listing.id,
			genreId: listing.genre_id,
			excludeSellerId: listing.seller_id,
			limit: 12,
		}),
	]);

	const images = coverUrls(listing);
	const section = SECTION[listing.listing_type];
	const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
	const monthFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
		month: "long",
		year: "numeric",
	});
	const posted = dateFmt.format(new Date(listing.created_at));

	const seller = listing.seller;
	const sellerName = seller?.display_name?.trim() || t("sellerFallback");
	const memberSince = seller ? monthFmt.format(new Date(seller.created_at)) : null;
	const phone = seller?.show_phone ? seller.phone : null;
	const conditionLabel = listing.condition ? tf(CONDITION_KEY[listing.condition]) : null;

	// Book attributes, all shown uniformly as "label: value".
	const details: { label: string; value: string }[] = [];
	if (conditionLabel) details.push({ label: tf("condition"), value: conditionLabel });
	if (listing.genre) details.push({ label: tf("genre"), value: genreName(listing.genre, locale) });
	if (listing.book_language)
		details.push({
			label: tf("language"),
			value: languageLabel(listing.book_language, locale),
		});
	if (listing.city) details.push({ label: tf("city"), value: cityLabel(listing.city, locale) });
	if (listing.isbn) details.push({ label: t("isbn"), value: listing.isbn });
	details.push({ label: t("posted"), value: posted });

	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<Breadcrumbs items={[{ label: tNav("home"), href: "/" }, { label: tNav(section.navKey), href: section.href }, { label: listing.title }]} />

			<div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,300px)]">
				{/* Cover */}
				<div className="mx-auto w-40 sm:w-48 lg:mx-0 lg:w-full lg:sticky lg:top-24 lg:self-start">
					<BookGallery images={images} title={listing.title} author={listing.author} spine={spineFor(listing.title)} />
				</div>

				{/* Middle: title, author, meta, seller */}
				<div className="min-w-0 space-y-4">
					<div>
						<h1 className="text-2xl font-bold leading-tight sm:text-[1.7rem]">{listing.title}</h1>
						{listing.author && <p className="mt-1 text-lg font-semibold text-primary">{listing.author}</p>}
					</div>

					{/* Details — all uniform "label: value" lines */}
					<div className="space-y-1 text-sm text-muted-foreground">
						{details.map((d) => (
							<p key={d.label}>
								{caps(d.label)}: <span className="text-foreground">{d.value}</span>
							</p>
						))}
					</div>

					{/* Seller */}
					<div className="space-y-1 pt-1 text-sm text-muted-foreground">
						<p>
							{caps(t("sellerLabel"))}:{" "}
							<Link href={`/user/${listing.seller_id}`} className="font-semibold text-primary hover:underline">
								{sellerName}
							</Link>
						</p>
						{memberSince && (
							<p>
								{caps(t("memberSinceLabel"))}: <span className="text-foreground">{memberSince}</span>
							</p>
						)}
					</div>
				</div>

				{/* Buy box */}
				<div className="lg:sticky lg:top-24 lg:self-start">
					<div className="rounded-xl border border-border bg-card p-4">
						{listing.status !== "active" && <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">{t("closedNotice")}</p>}

						<p className="font-bold">{tf(section.typeKey)}</p>
						{conditionLabel && <p className="text-sm text-muted-foreground">{conditionLabel}</p>}

						<div className="mt-3">
							<PriceBlock listing={listing} tCard={tCard} tBook={t} />
						</div>

						<div className="mt-4">
							{isOwner ? (
								<Link
									href={`/my-listings/${listing.id}/edit`}
									className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-foreground transition-colors hover:bg-primary/80"
								>
									<Pencil className="size-4" aria-hidden />
									{t("editListing")}
								</Link>
							) : (
								<ContactSeller
									listingId={listing.id}
									sellerId={listing.seller_id}
									phone={phone}
									wanted={listing.listing_type === "wanted"}
								/>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* About this item — full width below the columns */}
			{(listing.description || (listing.listing_type === "swap" && listing.swap_wanted)) && (
				<div className="mt-10 space-y-6 border-t border-border pt-6">
					{listing.description && (
						<section className="space-y-2">
							<h2 className="text-lg font-bold">{t("aboutItem")}</h2>
							<p className="max-w-3xl whitespace-pre-line leading-relaxed text-foreground/90">{listing.description}</p>
						</section>
					)}
					{listing.listing_type === "swap" && listing.swap_wanted && (
						<section className="space-y-2">
							<h2 className="text-lg font-bold">{t("wantsInReturn")}</h2>
							<p className="max-w-3xl whitespace-pre-line leading-relaxed text-foreground/90">{listing.swap_wanted}</p>
						</section>
					)}
				</div>
			)}

			{/* Report */}
			{!isOwner && (
				<div className="mt-8 flex justify-end border-t border-border pt-4">
					<ReportButton listingId={listing.id} />
				</div>
			)}

			{/* More from this seller (not shown on wanted posts — the "seller" is
			    the requester, so their for-sale books here would be confusing) */}
			{listing.listing_type !== "wanted" && sellerOther.length > 0 && (
				<div className="mt-12">
					<BookShelf title={t("moreFromSeller")} href={`/user/${listing.seller_id}`} listings={sellerOther} />
				</div>
			)}

			{/* Similar books */}
			{similar.length > 0 && (
				<div className="mt-12">
					<BookShelf title={t("similar")} href={listing.genre ? `/search?genre=${listing.genre.slug}` : "/buy"} listings={similar} />
				</div>
			)}
		</div>
	);
}

function PriceBlock({
	listing,
	tCard,
	tBook,
}: {
	listing: { listing_type: ListingType; price: number | null; is_negotiable: boolean };
	tCard: (key: string) => string;
	tBook: (key: string) => string;
}) {
	if (listing.listing_type === "wanted") {
		// Price here means "willing to pay" — optional.
		return listing.price != null ? (
			<div>
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tBook("willingToPay")}</p>
				<p className="text-3xl font-bold text-price">{formatLari(listing.price)}</p>
			</div>
		) : (
			<p className="text-xl font-semibold text-muted-foreground">{tBook("openToOffers")}</p>
		);
	}
	if (listing.listing_type === "swap") {
		return <span className="inline-flex rounded-lg bg-swap/10 px-3 py-1.5 text-lg font-semibold text-swap">{tCard("swap")}</span>;
	}
	if (listing.listing_type === "giveaway") {
		return <span className="inline-flex rounded-lg bg-give/10 px-3 py-1.5 text-lg font-semibold text-give">{tCard("free")}</span>;
	}
	if (listing.is_negotiable || listing.price == null) {
		return <p className="text-xl font-semibold text-muted-foreground">{tCard("negotiable")}</p>;
	}
	return <p className="text-3xl font-bold text-price">{formatLari(listing.price)}</p>;
}
