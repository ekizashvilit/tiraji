"use client";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Button } from "@/components/ui/button";

// "Notify me" / alerts call-to-action. Logged-out users get the auth sheet in
// place (no bounce through /account/alerts → /?auth=required); logged-in users
// go straight to the alerts page. Mirrors the header "List a book" pattern.
export function AlertsCta({
  href = "/account/alerts",
  size = "lg",
  children,
}: {
  href?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { openAuth } = useAuthSheet();

  async function onClick() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      openAuth();
      return;
    }
    router.push(href);
  }

  return (
    <Button size={size} onClick={onClick}>
      {children}
    </Button>
  );
}
