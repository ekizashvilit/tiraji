"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MessageCircle, Phone } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Button } from "@/components/ui/button";

// Contact actions on a listing. The phone (if the seller chose to show it) is
// the working channel today; "Message seller" opens the sign-in sheet when
// logged out and, until in-app chat ships, points people to the phone.
export function ContactSeller({ phone }: { phone: string | null }) {
  const t = useTranslations("book");
  const { openAuth } = useAuthSheet();
  const [revealed, setRevealed] = useState(false);

  async function onMessage() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      openAuth();
      return;
    }
    toast(t("messagingSoon"));
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
        onClick={onMessage}
      >
        <MessageCircle className="size-4" aria-hidden />
        {t("messageSeller")}
      </Button>
    </div>
  );
}
