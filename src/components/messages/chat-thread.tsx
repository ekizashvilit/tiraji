"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft, Maximize2, SendHorizontal, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import type { ThreadMessage } from "@/lib/messaging";
import { cn } from "@/lib/utils";

// A single conversation view with realtime updates and a composer. Rendered two
// ways: as a full "page" (the /messages/[id] route) or inside the floating
// "dock" window that pops up over any page.
export function ChatThread({
  conversationId,
  meId,
  otherName,
  listingId,
  listingTitle,
  initialMessages,
  variant = "page",
  onClose,
}: {
  conversationId: string;
  meId: string;
  otherName: string | null;
  listingId: string | null;
  listingTitle: string | null;
  initialMessages: ThreadMessage[];
  variant?: "page" | "dock";
  onClose?: () => void;
}) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const isDock = variant === "dock";

  const timeFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Append a message only if we don't already have it (realtime can echo back
  // a message we just inserted optimistically).
  function addMessage(m: ThreadMessage) {
    setMessages((prev) =>
      prev.some((x) => x.id === m.id) ? prev : [...prev, m],
    );
  }

  // Live updates + mark incoming messages as read on open.
  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", meId)
      .is("read_at", null)
      .then(() => {
        // Let the header badge recompute now that these are read.
        window.dispatchEvent(new Event("tiraji:messages-read"));
      });

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => addMessage(payload.new as ThreadMessage),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, meId]);

  // Keep the newest message in view — scroll the list itself, never the window.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: meId, body: text })
      .select("id,body,sender_id,read_at,created_at")
      .single<ThreadMessage>();
    setSending(false);
    if (error || !data) {
      toast.error(t("sendError"));
      return;
    }
    addMessage(data);
    setBody("");
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        isDock
          ? "h-full min-h-0"
          : "mx-auto h-[calc(100vh-9rem)] max-w-6xl px-4",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-border",
          isDock ? "bg-primary px-3 py-2.5 text-primary-foreground" : "py-3",
        )}
      >
        {!isDock && (
          <Link
            href="/messages"
            aria-label={t("back")}
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{otherName || t("someone")}</p>
          {listingId && listingTitle && (
            <Link
              href={`/book/${listingId}`}
              className={cn(
                "truncate text-sm hover:underline",
                isDock ? "text-primary-foreground/80" : "text-primary",
              )}
              onClick={onClose}
            >
              {listingTitle}
            </Link>
          )}
        </div>

        {isDock && (
          <>
            <Link
              href={`/messages/${conversationId}`}
              aria-label={t("openFull")}
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full text-primary-foreground/80 hover:bg-white/15 hover:text-primary-foreground"
            >
              <Maximize2 className="size-4" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="grid size-8 place-items-center rounded-full text-primary-foreground/80 hover:bg-white/15 hover:text-primary-foreground"
            >
              <X className="size-4.5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("threadEmpty")}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-[0.95rem]",
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <span
                    className={cn(
                      "mt-0.5 block text-[0.7rem]",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {timeFmt.format(new Date(m.created_at))}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="flex items-end gap-2 px-3 py-3 shadow-[0_-6px_14px_-10px_rgba(43,36,32,0.14)]"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
          rows={1}
          placeholder={t("placeholder")}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          aria-label={t("send")}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
        >
          <SendHorizontal className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
