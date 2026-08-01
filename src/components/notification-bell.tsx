"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MessageCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ConversationList } from "@/components/messages/conversation-list";
import {
  fetchConversations,
  type ConversationSummary,
} from "@/lib/messaging-shared";
import { useUnreadCount } from "@/lib/use-unread";

// Header messages button: opens a slide-in inbox sheet (rather than navigating
// to /messages). Notifications in this app are new messages only, so the badge
// tracks unread conversations and the sheet is the inbox itself.
export function NotificationBell() {
  const t = useTranslations("auth");
  const tc = useTranslations("chat");
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  const [convos, setConvos] = useState<ConversationSummary[] | null>(null);

  // (Re)load the inbox each time the sheet opens, so it reflects the latest
  // messages and read state without keeping a subscription alive while closed.
  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const list = user ? await fetchConversations(supabase, user.id) : [];
      if (active) setConvos(list);
    })();
    return () => {
      active = false;
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // Reset to the loading state on each open so a stale list never flashes.
  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) setConvos(null);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={tc("title")}
          className="relative size-9 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <MessageCircle className="size-4.5" />
          {unread > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 grid size-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.7rem] font-semibold text-primary-foreground ring-2 ring-background"
              aria-label={t("unreadCount", { count: unread })}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>{tc("title")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {convos === null ? (
            <div className="flex items-center justify-center py-16">
              <Loader2
                className="size-6 animate-spin text-muted-foreground"
                aria-hidden
              />
            </div>
          ) : convos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
              <MessageCircle
                className="h-10 w-10 text-muted-foreground"
                aria-hidden
              />
              <p className="max-w-sm text-muted-foreground">{tc("empty")}</p>
            </div>
          ) : (
            <ConversationList conversations={convos} onNavigate={close} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
