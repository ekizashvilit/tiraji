"use client";

import { usePathname } from "@/i18n/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Wraps the public marketplace chrome (header + footer) around normal pages,
// but renders nothing extra for /admin — that section provides its own full
// admin shell, so it lives in a visually separate environment.
export function PublicChrome({
  initialUser,
  initialDisplayName,
  children,
}: {
  initialUser: { email: string | null } | null;
  initialDisplayName: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <SiteHeader
        initialUser={initialUser}
        initialDisplayName={initialDisplayName}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
