"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { BookMarked, Check, Globe, Heart, LogOut, Menu, MessageCircle, Plus, Search, Shield, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type MinimalUser = { email: string | null };

const LOCALE_NAMES: Record<string, string> = { ka: "ქართული", en: "English" };

// The mobile "burger" — a single dropdown holding the language switch and the
// account/profile actions (the sections live in the bar below the search).
export function MobileMenu({ initialUser = null, initialDisplayName = null }: { initialUser?: MinimalUser | null; initialDisplayName?: string | null }) {
	const t = useTranslations("auth");
	const tNav = useTranslations("nav");
	const tw = useTranslations("wanted");
	const locale = useLocale();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();
	const { openAuth } = useAuthSheet();
	const [user, setUser] = useState<MinimalUser | null>(initialUser);
	const [displayName, setDisplayName] = useState<string | null>(initialDisplayName);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const supabase = createClient();

		async function loadProfile(userId: string) {
			const { data } = await supabase.from("profiles").select("display_name,is_admin").eq("id", userId).single();
			setDisplayName(data?.display_name ?? null);
			setIsAdmin(data?.is_admin ?? false);
		}

		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ? { email: session.user.email ?? null } : null);
			if (session?.user) loadProfile(session.user.id);
			else {
				setDisplayName(null);
				setIsAdmin(false);
			}
		});

		return () => sub.subscription.unsubscribe();
	}, []);

	// Preserve the current query string (e.g. a search) across a locale switch.
	const query = Object.fromEntries(searchParams.entries());

	async function signOut() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	}

	const itemCls = "gap-3 px-3 py-2.5 text-[0.95rem]";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="size-10 md:hidden" aria-label={tNav("menu")}>
					<Menu className="size-5.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={12} className="w-60 p-1.5">
				{user && (
					<>
						<p className="truncate px-3 py-2 text-sm font-semibold">{displayName?.trim() || user.email}</p>
						<DropdownMenuSeparator className="my-1" />
					</>
				)}

				{/* Language */}
				{routing.locales.map((l) => (
					<DropdownMenuItem
						key={l}
						onClick={() => router.replace({ pathname, query }, { locale: l })}
						className={cn(itemCls, l === locale && "font-medium text-primary")}
					>
						<Globe className="size-4.5" />
						{LOCALE_NAMES[l] ?? l}
						{l === locale && <Check className="ml-auto size-4.5" />}
					</DropdownMenuItem>
				))}

				<DropdownMenuSeparator className="my-1" />

				{/* List a book — logged-out users get the sign-in sheet right away
				    instead of bouncing through /sell first. */}
				{user ? (
					<DropdownMenuItem asChild className={itemCls}>
						<Link href="/sell">
							<Plus className="size-4.5" />
							{tNav("sell")}
						</Link>
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem onClick={openAuth} className={itemCls}>
						<Plus className="size-4.5" />
						{tNav("sell")}
					</DropdownMenuItem>
				)}

				{/* Post a wanted book — same auth-gated pattern as List a book. */}
				{user ? (
					<DropdownMenuItem asChild className={itemCls}>
						<Link href="/wanted/new">
							<Search className="size-4.5" />
							{tw("postCta")}
						</Link>
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem onClick={openAuth} className={itemCls}>
						<Search className="size-4.5" />
						{tw("postCta")}
					</DropdownMenuItem>
				)}

				<DropdownMenuSeparator className="my-1" />

				{/* Profile / account */}
				{user ? (
					<>
						<DropdownMenuItem asChild className={itemCls}>
							<Link href="/account">
								<UserRound className="size-4.5" />
								{t("account")}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className={itemCls}>
							<Link href="/my-listings">
								<BookMarked className="size-4.5" />
								{t("myListings")}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className={itemCls}>
							<Link href="/saved">
								<Heart className="size-4.5" />
								{t("saved")}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className={itemCls}>
							<Link href="/messages">
								<MessageCircle className="size-4.5" />
								{t("messages")}
							</Link>
						</DropdownMenuItem>
						{isAdmin && (
							<DropdownMenuItem asChild className={itemCls}>
								<Link href="/admin">
									<Shield className="size-4.5" />
									{t("admin")}
								</Link>
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator className="my-1" />
						<DropdownMenuItem onClick={signOut} className={itemCls}>
							<LogOut className="size-4.5" />
							{t("signOut")}
						</DropdownMenuItem>
					</>
				) : (
					<DropdownMenuItem onClick={openAuth} className={itemCls}>
						<UserRound className="size-4.5" />
						{t("signIn")}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
