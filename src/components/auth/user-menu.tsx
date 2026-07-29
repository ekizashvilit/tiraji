"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookMarked, LogOut, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type MinimalUser = { email: string | null };

export function UserMenu({
	initialUser = null,
	initialDisplayName = null,
	onNavigate,
}: {
	initialUser?: MinimalUser | null;
	initialDisplayName?: string | null;
	onNavigate?: () => void;
}) {
	const t = useTranslations("auth");
	const router = useRouter();
	const { openAuth } = useAuthSheet();
	// Seed from the server so the avatar is correct on first paint — no flash.
	const [user, setUser] = useState<MinimalUser | null>(initialUser);
	const [displayName, setDisplayName] = useState<string | null>(initialDisplayName);

	useEffect(() => {
		const supabase = createClient();

		async function loadName(userId: string) {
			const { data } = await supabase
				.from("profiles")
				.select("display_name")
				.eq("id", userId)
				.single();
			setDisplayName(data?.display_name ?? null);
		}

		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ? { email: session.user.email ?? null } : null);
			if (session?.user) loadName(session.user.id);
			else setDisplayName(null);
		});

		// Live-update the initial when the profile is saved elsewhere on the page.
		function onProfileUpdated(e: Event) {
			const detail = (e as CustomEvent<{ display_name?: string | null }>).detail;
			setDisplayName(detail?.display_name ?? null);
		}
		window.addEventListener("tiraji:profile-updated", onProfileUpdated);

		return () => {
			sub.subscription.unsubscribe();
			window.removeEventListener("tiraji:profile-updated", onProfileUpdated);
		};
	}, []);

	async function signOut() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	}

	if (!user) {
		return (
			<Button
				type="button"
				variant="ghost"
				onClick={() => {
					onNavigate?.();
					openAuth();
				}}
				className="h-11 gap-1.5 px-0 cursor-pointer hover:bg-transparent hover:text-inherit"
			>
				<UserRound className="size-5" />
				{t("signIn")}
			</Button>
		);
	}

	const initial = (displayName?.trim() || user.email || "?")
		.charAt(0)
		.toUpperCase();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full cursor-pointer hover:bg-transparent hover:text-inherit aria-expanded:bg-transparent aria-expanded:text-inherit"
					aria-label={t("account")}
				>
					<Avatar className="h-9 w-9">
						<AvatarFallback className="bg-secondary text-brand-dark">{initial}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={12} className="w-56 p-1.5">
				<DropdownMenuItem asChild className="gap-3 px-3 py-2.5 text-[0.95rem]">
					<Link href="/account">
						<UserRound className="size-4.5" />
						{t("account")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="gap-3 px-3 py-2.5 text-[0.95rem]">
					<Link href="/my-listings">
						<BookMarked className="size-4.5" />
						{t("myListings")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator className="my-1.5" />
				<DropdownMenuItem onClick={signOut} className="gap-3 px-3 py-2.5 text-[0.95rem]">
					<LogOut className="size-4.5" />
					{t("signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
