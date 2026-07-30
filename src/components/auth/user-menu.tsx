"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BookMarked, LogOut, MessageCircle, Shield, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { caps } from "@/lib/caps";

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
	const [isAdmin, setIsAdmin] = useState(false);
	const [unread, setUnread] = useState(0);
	const meIdRef = useRef<string | null>(null);
	// The header mounts two UserMenus (desktop + mobile), so each needs its own
	// realtime channel name — a shared name collides on the second subscribe().
	const channelId = useId();

	useEffect(() => {
		const supabase = createClient();

		async function loadProfile(userId: string) {
			const { data } = await supabase
				.from("profiles")
				.select("display_name,is_admin")
				.eq("id", userId)
				.single();
			setDisplayName(data?.display_name ?? null);
			setIsAdmin(data?.is_admin ?? false);
		}

		// Unread = number of conversations with unread messages addressed to me
		// (so two unread messages in one chat still count as one). RLS scopes the
		// query to the current user, so no extra filtering is needed.
		async function loadUnread() {
			const uid = meIdRef.current;
			if (!uid) {
				setUnread(0);
				return;
			}
			const { data } = await supabase
				.from("messages")
				.select("conversation_id")
				.is("read_at", null)
				.neq("sender_id", uid);
			const conversations = new Set(
				(data ?? []).map((m) => m.conversation_id),
			);
			setUnread(conversations.size);
		}

		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ? { email: session.user.email ?? null } : null);
			if (session?.user) {
				meIdRef.current = session.user.id;
				loadProfile(session.user.id);
				loadUnread();
			} else {
				meIdRef.current = null;
				setDisplayName(null);
				setIsAdmin(false);
				setUnread(0);
			}
		});

		// Refresh the badge live as messages arrive or get marked read.
		const channel = supabase
			.channel(`unread-messages-${channelId}`)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "messages" },
				() => loadUnread(),
			)
			.subscribe();
		window.addEventListener("tiraji:messages-read", loadUnread);

		// Live-update the initial when the profile is saved elsewhere on the page.
		function onProfileUpdated(e: Event) {
			const detail = (e as CustomEvent<{ display_name?: string | null }>).detail;
			setDisplayName(detail?.display_name ?? null);
		}
		window.addEventListener("tiraji:profile-updated", onProfileUpdated);

		return () => {
			sub.subscription.unsubscribe();
			supabase.removeChannel(channel);
			window.removeEventListener("tiraji:messages-read", loadUnread);
			window.removeEventListener("tiraji:profile-updated", onProfileUpdated);
		};
	}, [channelId]);

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

	const initial = caps((displayName?.trim() || user.email || "?").charAt(0));

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative rounded-full cursor-pointer hover:bg-transparent hover:text-inherit aria-expanded:bg-transparent aria-expanded:text-inherit"
					aria-label={t("account")}
				>
					<Avatar className="h-9 w-9">
						<AvatarFallback className="bg-secondary text-brand-dark">{initial}</AvatarFallback>
					</Avatar>
					{unread > 0 && (
						<span
							className="absolute -right-0.5 -top-0.5 grid size-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.7rem] font-semibold text-primary-foreground ring-2 ring-background"
							aria-label={t("unreadCount", { count: unread })}
						>
							{unread > 9 ? "9+" : unread}
						</span>
					)}
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
				<DropdownMenuItem asChild className="gap-3 px-3 py-2.5 text-[0.95rem]">
					<Link href="/messages">
						<MessageCircle className="size-4.5" />
						{t("messages")}
						{unread > 0 && (
							<span className="ml-auto grid size-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.7rem] font-semibold text-primary-foreground">
								{unread > 9 ? "9+" : unread}
							</span>
						)}
					</Link>
				</DropdownMenuItem>
				{isAdmin && (
					<DropdownMenuItem asChild className="gap-3 px-3 py-2.5 text-[0.95rem]">
						<Link href="/admin">
							<Shield className="size-4.5" />
							{t("admin")}
						</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator className="my-1.5" />
				<DropdownMenuItem onClick={signOut} className="gap-3 px-3 py-2.5 text-[0.95rem]">
					<LogOut className="size-4.5" />
					{t("signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
