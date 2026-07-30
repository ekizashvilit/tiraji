"use client";

import { useTranslations } from "next-intl";
import { ArrowLeftRight, BookOpen, Gift, Plus, ShoppingBag } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { HeaderSearch } from "@/components/header-search";
import { cn } from "@/lib/utils";
import { caps } from "@/lib/caps";

const SECTIONS = [
	{ href: "/buy", key: "buy", icon: ShoppingBag },
	{ href: "/swap", key: "swap", icon: ArrowLeftRight },
	{ href: "/giveaway", key: "giveaway", icon: Gift },
] as const;

export function SiteHeader({
	initialUser = null,
	initialDisplayName = null,
}: {
	initialUser?: { email: string | null } | null;
	initialDisplayName?: string | null;
}) {
	const t = useTranslations("nav");
	const pathname = usePathname();
	const isHome = pathname === "/";

	const navLinks = SECTIONS.map((s) => {
		const active = pathname === s.href || pathname.startsWith(s.href + "/");
		const Icon = s.icon;
		return (
			<Link
				key={s.href}
				href={s.href}
				className={cn(
					"caps relative inline-flex items-center gap-1.5 px-3 py-3 text-[0.95rem] font-semibold transition-colors hover:text-primary",
					active ? "text-primary" : "text-muted-foreground",
				)}
			>
				<Icon className="size-4" aria-hidden />
				{caps(t(s.key))}
				{active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden />}
			</Link>
		);
	});

	return (
		<>
			{/* Primary header (logo · search · account, plus mobile search) — sticky; casts the shadow.
			    It's its own element so the nav row below stays in normal flow and scrolls away. */}
			<header className="sticky top-0 z-40 bg-background shadow-[0_2px_10px_-4px_rgba(43,36,32,0.15)]">
				{/* Top row: logo · search · account. On mobile the logo is just the
				    icon, the search fills the middle, and the burger holds the rest. */}
				<div className="mx-auto flex h-20 max-w-6xl items-center gap-2 px-4 md:gap-6">
					<Link href="/" className="flex shrink-0 items-center gap-2 text-primary" aria-label="ტირაჟი">
						<BookOpen className="h-7 w-7" aria-hidden />
						<span className="caps hidden text-2xl font-bold text-brand-dark md:inline">{caps("ტირაჟი")}</span>
					</Link>

					<HeaderSearch className="flex flex-1" />

					<div className="flex items-center gap-2 md:gap-4">
						<div className="hidden md:block">
							<LanguageSwitcher />
						</div>
						<div className="hidden md:block">
							<UserMenu initialUser={initialUser} initialDisplayName={initialDisplayName} />
						</div>
						<MobileMenu initialUser={initialUser} initialDisplayName={initialDisplayName} />
					</div>
				</div>
			</header>

			{/* Section bar (AbeBooks-style): the sections on the left, List a book on
			    the right. Shown on every page on mobile (it's the mobile section nav),
			    but on desktop only on the home page. Normal flow — scrolls away under
			    the sticky header, and reappears when you scroll back to the top. */}
			<div className={cn("bg-background", !isHome && "md:hidden")}>
				<nav className="mx-auto flex max-w-6xl items-center justify-between px-3">
					<div className="flex flex-1 items-center justify-between md:flex-none md:justify-start">{navLinks}</div>
					<Link href="/sell" className="caps hidden items-center gap-1.5 px-3 py-6 text-[0.95rem] font-semibold text-primary hover:underline md:flex">
						<Plus className="h-4 w-4" aria-hidden />
						{caps(t("sell"))}
					</Link>
				</nav>
			</div>
		</>
	);
}
