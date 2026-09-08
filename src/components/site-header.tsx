"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  BookMarked,
  Gift,
  Plus,
  ShoppingBag,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { HeaderSearch } from "@/components/header-search";
import { SavedButton } from "@/components/saved-button";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { caps } from "@/lib/caps";

const SECTIONS = [
  { href: "/buy", key: "buy", icon: ShoppingBag },
  { href: "/swap", key: "swap", icon: ArrowLeftRight },
  { href: "/giveaway", key: "giveaway", icon: Gift },
  { href: "/wanted", key: "wanted", icon: BookMarked },
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
  const { openAuth } = useAuthSheet();

  // Track sign-in state so "Add a book" can open the auth sheet directly for
  // logged-out users instead of bouncing them through /add first. Seeded from
  // the server-rendered user and kept live via Supabase auth changes.
  const [signedIn, setSignedIn] = useState(!!initialUser);
  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const sellCls =
    "caps hidden items-center gap-1.5 px-3 py-6 text-[0.95rem] font-semibold text-primary hover:underline md:flex";

  const navLinks = SECTIONS.map((s) => {
    const active = pathname === s.href || pathname.startsWith(s.href + "/");
    return (
      <Link
        key={s.href}
        href={s.href}
        className={cn(
          "caps relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3 text-[0.95rem] font-semibold transition-colors hover:text-primary",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        {caps(t(s.key))}
        {active && (
          <span
            className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
            aria-hidden
          />
        )}
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
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-primary mr-2 md:mr-0"
            aria-label="ტირაჟი"
          >
            <img
              src="/logo.svg"
              alt=""
              className="h-10 w-auto md:h-14"
              aria-hidden
            />
          </Link>

          <HeaderSearch className="flex flex-1" />

          <div className="flex items-center">
            {/* Saved + notifications are personal — only for signed-in users. */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {signedIn && (
              <div className="hidden md:flex md:items-center">
                <NotificationBell />
                <SavedButton />
              </div>
            )}
            <div className={cn("hidden md:block", signedIn && "md:ml-2")}>
              <UserMenu
                initialUser={initialUser}
                initialDisplayName={initialDisplayName}
              />
            </div>
            <MobileMenu
              initialUser={initialUser}
              initialDisplayName={initialDisplayName}
            />
          </div>
        </div>
      </header>

      {/* Section bar (AbeBooks-style): sections on the left, List a book on the
			    right. Home page only, on every viewport. Normal flow — scrolls away
			    under the sticky header, and reappears when you scroll back to the top. */}
      {isHome && (
        <div className="bg-background">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-0 md:px-3">
            <div className="no-scrollbar flex flex-1 items-center justify-start overflow-x-auto md:flex-none">
              {navLinks}
            </div>
            {signedIn ? (
              <Link href="/add" className={sellCls}>
                <Plus className="h-4 w-4" aria-hidden />
                {caps(t("sell"))}
              </Link>
            ) : (
              <button type="button" onClick={openAuth} className={sellCls}>
                <Plus className="h-4 w-4" aria-hidden />
                {caps(t("sell"))}
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
