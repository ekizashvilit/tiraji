import { createClient } from "@/lib/supabase/server";
import { fetchConversations, type ConversationSummary } from "@/lib/messaging-shared";

export type { ConversationSummary };

// Shapes returned from the conversations query (listing embedded to-one).
type ConvRow = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  listing: { id: string; title: string } | null;
};

// Every conversation the current user is part of (as buyer or seller), with the
// other person's name, the book, the latest message and an unread count.
export async function getMyConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return fetchConversations(supabase, user.id);
}

export type ThreadMessage = {
  id: string;
  body: string;
  sender_id: string;
  read_at: string | null;
  created_at: string;
};

export type ConversationThread = {
  id: string;
  meId: string;
  otherName: string | null;
  listingId: string | null;
  listingTitle: string | null;
  messages: ThreadMessage[];
};

// A single conversation with its full message history. Returns null when the
// conversation doesn't exist or the user isn't a party (RLS hides it).
export async function getConversationThread(
  id: string,
): Promise<ConversationThread | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: conv } = await supabase
    .from("conversations")
    .select("id,listing_id,buyer_id,seller_id,listing:listings(id,title)")
    .eq("id", id)
    .maybeSingle<ConvRow>();
  if (!conv) return null;

  const otherId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
  const [{ data: msgData }, { data: person }] = await Promise.all([
    supabase
      .from("messages")
      .select("id,body,sender_id,read_at,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("public_seller")
      .select("display_name")
      .eq("id", otherId)
      .maybeSingle<{ display_name: string | null }>(),
  ]);

  return {
    id: conv.id,
    meId: user.id,
    otherName: person?.display_name?.trim() || null,
    listingId: conv.listing?.id ?? conv.listing_id ?? null,
    listingTitle: conv.listing?.title ?? null,
    messages: (msgData as ThreadMessage[] | null) ?? [],
  };
}
