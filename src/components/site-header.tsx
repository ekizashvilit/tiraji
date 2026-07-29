"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Menu, Plus, X } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { HeaderSearch } from "@/components/header-search";
import { cn } from "@/lib/utils";

const SECTIONS = [
	{ href: "/buy", key: "buy" },
	{ href: "/swap", key: "swap" },
	{ href: "/giveaway", key: "giveaway" },
] as const;

export function SiteHeader() {
	const t = useTranslations("nav");
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [navHidden, setNavHidden] = useState(false);

	// Hide the nav row when scrolling down, reveal it when scrolling back up.
	useEffect(() => {
		let lastY = window.scrollY;
		let ticking = false;
		function update() {
			const y = Math.max(0, window.scrollY);
			if (y < 80) setNavHidden(false);
			else if (y - lastY > 6) setNavHidden(true);
			else if (lastY - y > 6) setNavHidden(false);
			lastY = y;
			ticking = false;
		}
		function onScroll() {
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(update);
			}
		}
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const navLinks = SECTIONS.map((s) => {
		const active = pathname === s.href || pathname.startsWith(s.href + "/");
		return (
			<Link
				key={s.href}
				href={s.href}
				onClick={() => setOpen(false)}
				className={cn("caps relative px-3 py-3.5 text-[0.9rem] font-medium transition-colors hover:text-primary", active ? "text-primary" : "text-foreground")}
			>
				{t(s.key).toUpperCase()}
				{active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden />}
			</Link>
		);
	});

	return (
		<header className="sticky top-0 z-40 bg-background">
			{/* Top row: logo · search · account */}
			<div className="border-b border-border">
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
							<UserMenu />
						</div>
						<Button variant="outline" size="icon" className="h-11 w-11 md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
							{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</Button>
					</div>
				</div>
			</div>

			{/* Mobile search */}
			<div className="border-b border-border px-4 py-2.5 md:hidden">
				<HeaderSearch />
			</div>

			{/* Nav row (AbeBooks-style): sections on the left, List a book on the right */}
			<div
				className={cn(
					"overflow-hidden border-b border-border transition-[max-height,opacity] duration-300 ease-out",
					navHidden ? "max-h-0 opacity-0" : "max-h-16 opacity-100",
				)}
			>
				<nav className="mx-auto flex max-w-6xl items-center justify-between px-3">
					<div className="flex items-center">{navLinks}</div>
					<Link href="/sell" className="caps flex items-center gap-1.5 px-3 py-3.5 text-[0.9rem] font-semibold text-primary hover:underline">
						<Plus className="h-4 w-4" aria-hidden />
						{t("sell").toUpperCase()}
					</Link>
				</nav>
			</div>

			{/* Mobile menu */}
			{open && (
				<div className="border-b border-border bg-background md:hidden">
					<nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
						{SECTIONS.map((s) => (
							<Link key={s.href} href={s.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-[0.95rem] font-medium hover:bg-accent">
								{t(s.key)}
							</Link>
						))}
						<Link href="/sell" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-[0.95rem] font-semibold text-primary hover:bg-accent">
							{t("sell")}
						</Link>
						<div className="mt-2 flex items-center gap-2">
							<LanguageSwitcher />
							<UserMenu />
						</div>
					</nav>
				</div>
			)}
		</header>
	);
}
