"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BookMarked,
  ExternalLink,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { caps } from "@/lib/caps";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", key: "navDashboard", icon: LayoutDashboard },
  { href: "/admin/listings", key: "navListings", icon: BookMarked },
  { href: "/admin/reports", key: "navReports", icon: Flag },
] as const;

// The separate admin environment: a dark sidebar (desktop) / drawer (mobile),
// a slim topbar, and the page content. Rendered instead of the public header
// and footer for every /admin route.
export function AdminShell({
  displayName,
  children,
}: {
  displayName: string | null;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const current = NAV.find((n) => n.href === pathname) ?? NAV[0];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <BookMarked className="size-6" aria-hidden />
        <span className="caps text-lg font-bold">{caps("ტირაჟი")}</span>
        <span className="ml-1 rounded bg-white/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide">
          {t("navShort")}
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-4.5" aria-hidden />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="size-4.5" aria-hidden />
          {t("viewSite")}
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4.5" aria-hidden />
          {tAuth("signOut")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 bg-primary text-primary-foreground md:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showClose={false}
          className="w-64 gap-0 bg-primary p-0 text-primary-foreground"
        >
          <SheetTitle className="sr-only">{t("panelTitle")}</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("navShort")}
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <h1 className="font-semibold">{t(current.key)}</h1>
          {displayName && (
            <span className="ml-auto hidden text-sm text-muted-foreground sm:block">
              {displayName}
            </span>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
