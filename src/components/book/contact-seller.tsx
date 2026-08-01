"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, MessageCircle, Phone } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { useChatDock } from "@/components/messages/chat-dock";
import { Button } from "@/components/ui/button";

// Contact actions on a listing. The phone (if the seller chose to show it) is
// one channel; "Message seller" opens the sign-in sheet when logged out, else
// finds-or-creates a conversation with the seller and pops open the chat window.
export function ContactSeller({
  listingId,
  sellerId,
  phone,
  wanted = false,
}: {
  listingId: string;
  sellerId: string;
  phone: string | null;
  // On a "wanted" post the roles reverse: the viewer HAS the book and is
  // reaching out to the requester, so the button reads differently.
  wanted?: boolean;
}) {
  const t = useTranslations("book");
  const { openAuth } = useAuthSheet();
  const { openChat } = useChatDock();
  const [revealed, setRevealed] = useState(false);
  const [starting, setStarting] = useState(false);

  async function onMessage() {
    if (starting) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      openAuth();
      return;
    }

    setStarting(true);
    // One conversation per (listing, buyer) — reuse it if it already exists.
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle<{ id: string }>();

    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId,
        })
        .select("id")
        .single<{ id: string }>();
      if (error || !created) {
        setStarting(false);
        toast.error(t("messageError"));
        return;
      }
      conversationId = created.id;
    }

    setStarting(false);
    openChat(conversationId);
  }

  return (
    <div className="space-y-2">
      {phone &&
        (revealed ? (
          <Button asChild size="lg" className="w-full gap-2">
            <a href={`tel:${phone}`}>
              <Phone className="size-4" aria-hidden />
              {phone}
            </a>
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => setRevealed(true)}
          >
            <Phone className="size-4" aria-hidden />
            {t("showPhone")}
          </Button>
        ))}

      <Button
        variant={phone ? "outline" : "default"}
        size="lg"
        className="w-full gap-2"
        disabled={starting}
        onClick={onMessage}
      >
        {starting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <MessageCircle className="size-4" aria-hidden />
        )}
        {wanted ? t("iHaveThisBook") : t("messageSeller")}
      </Button>
    </div>
  );
}
