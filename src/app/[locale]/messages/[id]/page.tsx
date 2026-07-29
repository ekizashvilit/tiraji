import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversationThread } from "@/lib/messaging";
import { ChatThread } from "@/components/messages/chat-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/?auth=required", locale });
  }

  const thread = await getConversationThread(id);
  if (!thread) {
    // Not a party, or no such conversation.
    redirect({ href: "/messages", locale });
  }

  return (
    <ChatThread
      conversationId={thread!.id}
      meId={thread!.meId}
      otherName={thread!.otherName}
      listingId={thread!.listingId}
      listingTitle={thread!.listingTitle}
      initialMessages={thread!.messages}
    />
  );
}
