import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

// Query + shaping for the inbox, split out so both the server (messages page)
// and the browser (header messages sheet) can build the same summaries — the
// only difference is which Supabase client they pass in. No server-only imports
// live here, so it's safe to pull into a client component.

type Client = SupabaseClient<Database>;

// Shapes returned from the conversations query (listing embedded to-one).
type ConvRow = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  listing: { id: string; title: string } | null;
};

type MsgRow = {
  conversation_id: string;
  body: string;
  sender_id: string;
  read_at: string | null;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  listingId: string | null;
  listingTitle: string | null;
  otherName: string | null;
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
};

// Every conversation the user is part of (as buyer or seller), with the other
// person's name, the book, the latest message and an unread count.
export async function fetchConversations(
  supabase: Client,
  userId: string,
): Promise<ConversationSummary[]> {
  const { data: convData } = await supabase
    .from("conversations")
    .select("id,listing_id,buyer_id,seller_id,listing:listings(id,title)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  const convos = (convData as unknown as ConvRow[] | null) ?? [];
  if (convos.length === 0) return [];

  const ids = convos.map((c) => c.id);
  const otherIds = Array.from(
    new Set(
      convos.map((c) => (c.buyer_id === userId ? c.seller_id : c.buyer_id)),
    ),
  );

  const [{ data: msgData }, { data: people }] = await Promise.all([
    supabase
      .from("messages")
      .select("conversation_id,body,sender_id,read_at,created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: true }),
    supabase.from("public_seller").select("id,display_name").in("id", otherIds),
  ]);
  const messages = (msgData as MsgRow[] | null) ?? [];
  const nameById = new Map(
    (
      (people as { id: string; display_name: string | null }[] | null) ?? []
    ).map((p) => [p.id, p.display_name]),
  );

  return convos
    .map((c) => {
      const mine = messages.filter((m) => m.conversation_id === c.id);
      const last = mine[mine.length - 1];
      const otherId = c.buyer_id === userId ? c.seller_id : c.buyer_id;
      return {
        id: c.id,
        listingId: c.listing?.id ?? c.listing_id ?? null,
        listingTitle: c.listing?.title ?? null,
        otherName: nameById.get(otherId)?.trim() || null,
        lastBody: last?.body ?? null,
        lastAt: last?.created_at ?? null,
        unread: mine.filter((m) => m.sender_id !== userId && !m.read_at).length,
      };
    })
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
}
