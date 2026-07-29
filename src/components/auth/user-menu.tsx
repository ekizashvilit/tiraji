"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { BookMarked, LogOut, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMenu() {
	const t = useTranslations("auth");
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			setUser(data.user);
			setLoaded(true);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});
		return () => sub.subscription.unsubscribe();
	}, []);

	async function signOut() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	}

	// Avoid a flash: render a same-size placeholder until we know the auth state.
	if (!loaded) return <div className="h-11 w-24" aria-hidden />;

	if (!user) {
		return (
			<Button asChild variant="ghost" className="h-11 gap-1.5 px-0 cursor-pointer hover:bg-transparent hover:text-inherit">
				<Link href="/login">
					<UserRound className="size-5" />
					{t("signIn")}
				</Link>
			</Button>
		);
	}

	const initial = (user.email ?? "?").charAt(0).toUpperCase();

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
			<DropdownMenuContent align="end" className="w-52">
				<DropdownMenuItem asChild>
					<Link href="/account">
						<UserRound className="h-4 w-4" />
						{t("account")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/my-listings">
						<BookMarked className="h-4 w-4" />
						{t("myListings")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={signOut}>
					<LogOut className="h-4 w-4" />
					{t("signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
