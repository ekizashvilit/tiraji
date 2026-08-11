"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { ThreadMessage } from "@/lib/messaging";
import { Button } from "@/components/ui/button";
import { ChatThread } from "@/components/messages/chat-thread";

type ChatDockContextValue = {
  openChat: (conversationId: string) => void;
  closeChat: () => void;
};

const ChatDockContext = createContext<ChatDockContextValue | null>(null);

export function useChatDock() {
  const ctx = useContext(ChatDockContext);
  if (!ctx) {
    throw new Error("useChatDock must be used within a ChatDockProvider");
  }
  return ctx;
}

// Holds the currently-open conversation and renders the floating chat window
// over the page. Kept at the layout level so it survives client navigation —
// the window stays open as you move between pages (Messenger-style).
export function ChatDockProvider({ children }: { children: React.ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const openChat = useCallback((id: string) => setConversationId(id), []);
  const closeChat = useCallback(() => setConversationId(null), []);

  return (
    <ChatDockContext.Provider value={{ openChat, closeChat }}>
      {children}
      {conversationId && (
        <ChatDockWindow
          key={conversationId}
          conversationId={conversationId}
          onClose={closeChat}
        />
      )}
    </ChatDockContext.Provider>
  );
}

type Loaded = {
  meId: string;
  otherName: string | null;
  listingId: string | null;
  listingTitle: string | null;
  messages: ThreadMessage[];
};

type ConvRow = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  listing: { id: string; title: string } | null;
};

function ChatDockWindow({
  conversationId,
  onClose,
}: {
  conversationId: string;
  onClose: () => void;
}) {
  const t = useTranslations("chat");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  // Load the thread client-side (RLS ensures only a party can read it).
  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setFailed(true);
        return;
      }

      const { data: conv } = await supabase
        .from("conversations")
        .select("id,listing_id,buyer_id,seller_id,listing:listings(id,title)")
        .eq("id", conversationId)
        .maybeSingle<ConvRow>();
      if (!conv) {
        if (active) setFailed(true);
        return;
      }

      const otherId =
        conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
      const [{ data: msgData }, { data: person }] = await Promise.all([
        supabase
          .from("messages")
          .select("id,body,sender_id,read_at,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
        supabase
          .from("public_seller")
          .select("display_name")
          .eq("id", otherId)
          .maybeSingle<{ display_name: string | null }>(),
      ]);
      if (!active) return;

      setLoaded({
        meId: user.id,
        otherName: person?.display_name?.trim() || null,
        listingId: conv.listing?.id ?? conv.listing_id ?? null,
        listingTitle: conv.listing?.title ?? null,
        messages: (msgData as ThreadMessage[] | null) ?? [],
      });
    })();

    return () => {
      active = false;
    };
  }, [conversationId]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4">
      <div className="mx-auto flex h-[70vh] max-h-[560px] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:mx-0 sm:h-[520px] sm:w-[380px] sm:rounded-2xl">
        {loaded ? (
          <ChatThread
            variant="dock"
            conversationId={conversationId}
            onClose={onClose}
            meId={loaded.meId}
            otherName={loaded.otherName}
            listingId={loaded.listingId}
            listingTitle={loaded.listingTitle}
            initialMessages={loaded.messages}
          />
        ) : failed ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("sendError")}</p>
            <Button type="button" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader2
              className="size-6 animate-spin text-muted-foreground"
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
  );
}
