"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookMarked, LogOut, Search, Shield, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const tw = useTranslations("wanted");
  const router = useRouter();
  const { openAuth } = useAuthSheet();
  // Seed from the server so the avatar is correct on first paint — no flash.
  const [user, setUser] = useState<MinimalUser | null>(initialUser);
  const [displayName, setDisplayName] = useState<string | null>(
    initialDisplayName,
  );
  const [isAdmin, setIsAdmin] = useState(false);

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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email ?? null } : null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setDisplayName(null);
        setIsAdmin(false);
      }
    });

    // Live-update the initial when the profile is saved elsewhere on the page.
    function onProfileUpdated(e: Event) {
      const detail = (e as CustomEvent<{ display_name?: string | null }>)
        .detail;
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
        size="icon"
        onClick={() => {
          onNavigate?.();
          openAuth();
        }}
        aria-label={t("signIn")}
        className="rounded-full text-muted-foreground cursor-pointer hover:bg-transparent hover:text-foreground"
      >
        <UserRound className="size-5" />
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
          className="rounded-full cursor-pointer hover:bg-transparent hover:text-inherit aria-expanded:bg-transparent aria-expanded:text-inherit"
          aria-label={t("account")}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-secondary text-brand-dark">
              {initial}
            </AvatarFallback>
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
        <DropdownMenuItem asChild className="gap-3 px-3 py-2.5 text-[0.95rem]">
          <Link href="/wanted/new">
            <Search className="size-4.5" />
            {tw("postCta")}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            asChild
            className="gap-3 px-3 py-2.5 text-[0.95rem]"
          >
            <Link href="/admin">
              <Shield className="size-4.5" />
              {t("admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          onClick={signOut}
          className="gap-3 px-3 py-2.5 text-[0.95rem]"
        >
          <LogOut className="size-4.5" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
