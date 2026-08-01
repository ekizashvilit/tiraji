"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/lib/use-unread";

// Header bell → the messages inbox, with a live unread badge. Notifications in
// this app are new messages only, so the bell is just a shortcut to /messages.
export function NotificationBell() {
  const t = useTranslations("auth");
  const unread = useUnreadCount();

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative size-9 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground"
    >
      <Link href="/messages" aria-label={t("messages")}>
        <MessageCircle className="size-4.5" />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid size-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.7rem] font-semibold text-primary-foreground ring-2 ring-background"
            aria-label={t("unreadCount", { count: unread })}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}
