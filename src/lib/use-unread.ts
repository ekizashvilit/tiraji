"use client";

import { useEffect, useId, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

// Number of conversations with unread messages addressed to me (two unread
// messages in one chat still count as one). Subscribes to auth + realtime
// message changes so the count stays live. Shared by the header notification
// bell and anywhere else that needs the badge. RLS scopes the query to me, so
// no extra filtering is needed.
export function useUnreadCount(): number {
  const [unread, setUnread] = useState(0);
  const meIdRef = useRef<string | null>(null);
  // Each mount needs its own realtime channel name — a shared name collides on
  // the second subscribe() when two consumers mount.
  const channelId = useId();

  useEffect(() => {
    const supabase = createClient();

    async function loadUnread() {
      const uid = meIdRef.current;
      if (!uid) {
        setUnread(0);
        return;
      }
      const { data } = await supabase
        .from("messages")
        .select("conversation_id")
        .is("read_at", null)
        .neq("sender_id", uid);
      setUnread(new Set((data ?? []).map((m) => m.conversation_id)).size);
    }

    // Seed from the current session, then keep it in sync with auth changes.
    supabase.auth.getUser().then(({ data: { user } }) => {
      meIdRef.current = user?.id ?? null;
      loadUnread();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      meIdRef.current = session?.user?.id ?? null;
      loadUnread();
    });

    // Refresh the badge live as messages arrive or get marked read.
    const channel = supabase
      .channel(`unread-messages-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => loadUnread(),
      )
      .subscribe();
    window.addEventListener("tiraji:messages-read", loadUnread);

    return () => {
      sub.subscription.unsubscribe();
      supabase.removeChannel(channel);
      window.removeEventListener("tiraji:messages-read", loadUnread);
    };
  }, [channelId]);

  return unread;
}
