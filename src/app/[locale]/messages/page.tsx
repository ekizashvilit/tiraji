import { setRequestLocale, getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyConversations } from "@/lib/messaging";
import { PageHeader } from "@/components/page-header";
import { ConversationList } from "@/components/messages/conversation-list";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/?auth=required", locale });
  }

  const t = await getTranslations("chat");
  const conversations = await getMyConversations();

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="max-w-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <ConversationList conversations={conversations} />
        )}
      </div>
    </>
  );
}
