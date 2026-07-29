"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, BookOpen, Gift, Menu, Plus, ShoppingBag, X } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { HeaderSearch } from "@/components/header-search";
import { cn } from "@/lib/utils";

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
	const [open, setOpen] = useState(false);

	const navLinks = SECTIONS.map((s) => {
		const active = pathname === s.href || pathname.startsWith(s.href + "/");
		const Icon = s.icon;
		return (
			<Link
				key={s.href}
				href={s.href}
				onClick={() => setOpen(false)}
				className={cn("caps relative inline-flex items-center gap-1.5 px-3 py-3 text-[0.95rem] font-semibold transition-colors hover:text-primary", active ? "text-primary" : "text-muted-foreground")}
			>
				<Icon className="size-4" aria-hidden />
				{t(s.key).toUpperCase()}
				{active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden />}
			</Link>
		);
	});

	return (
		<>
			{/* Primary header (logo · search · account, plus mobile search) — sticky; casts the shadow.
			    It's its own element so the nav row below stays in normal flow and scrolls away. */}
			<header className="sticky top-0 z-40 bg-background shadow-[0_2px_10px_-4px_rgba(43,36,32,0.15)]">
				{/* Top row: logo · search · account */}
				<div className="mx-auto flex h-20 max-w-6xl items-center gap-6 px-4 justify-between">
					<Link href="/" className="flex shrink-0 items-center gap-2 text-primary" onClick={() => setOpen(false)}>
						<BookOpen className="h-7 w-7" aria-hidden />
						<span className="caps text-2xl font-bold text-brand-dark">{"ტირაჟი".toUpperCase()}</span>
					</Link>

					<HeaderSearch className="hidden flex-1 md:flex" />

					<div className="flex items-center gap-4">
						<div className="hidden sm:block">
							<LanguageSwitcher />
						</div>
						<div className="hidden sm:block">
							<UserMenu initialUser={initialUser} initialDisplayName={initialDisplayName} />
						</div>
						<Button variant="outline" size="icon" className="h-11 w-11 md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
							{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</Button>
					</div>
				</div>

				{/* Mobile search */}
				<div className="px-4 py-2.5 md:hidden">
					<HeaderSearch />
				</div>

				{/* Mobile menu */}
				{open && (
					<div className="border-b border-border bg-background md:hidden">
						<nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
							{SECTIONS.map((s) => {
								const Icon = s.icon;
								return (
									<Link key={s.href} href={s.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[0.95rem] font-medium hover:bg-accent">
										<Icon className="size-4.5" aria-hidden />
										{t(s.key)}
									</Link>
								);
							})}
							<Link href="/sell" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[0.95rem] font-semibold text-primary hover:bg-accent">
								<Plus className="size-4.5" aria-hidden />
								{t("sell")}
							</Link>
							<div className="mt-2 flex items-center gap-2">
								<LanguageSwitcher />
								<UserMenu initialUser={initialUser} initialDisplayName={initialDisplayName} onNavigate={() => setOpen(false)} />
							</div>
						</nav>
					</div>
				)}
			</header>

			{/* Nav row (AbeBooks-style): sections on the left, List a book on the right — home only.
			    Normal flow — scrolls away under the sticky header, and reappears when you scroll back to the top. */}
			{isHome && (
				<div className="bg-background">
					<nav className="mx-auto flex max-w-6xl items-center justify-between px-3">
						<div className="flex items-center">{navLinks}</div>
						<Link href="/sell" className="caps flex items-center gap-1.5 px-3 py-6 text-[0.95rem] font-semibold text-primary hover:underline">
							<Plus className="h-4 w-4" aria-hidden />
							{t("sell").toUpperCase()}
						</Link>
					</nav>
				</div>
			)}
		</>
	);
}
