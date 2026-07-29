"use client";

import { useLocale, useTranslations } from "next-intl";

import type { ConversationSummary } from "@/lib/messaging";
import { Link } from "@/i18n/navigation";

// The inbox list. Each row opens the conversation on its own full page.
export function ConversationList({
  conversations,
}: {
  conversations: ConversationSummary[];
}) {
  const t = useTranslations("chat");
  const locale = useLocale();

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ka-GE", {
    day: "numeric",
    month: "short",
  });

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/messages/${c.id}`}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/50"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-brand-dark">
              {(c.otherName || t("someone")).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">
                  {c.otherName || t("someone")}
                </p>
                {c.lastAt && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {dateFmt.format(new Date(c.lastAt))}
                  </span>
                )}
              </div>
              {c.listingTitle && (
                <p className="truncate text-xs text-primary">
                  {c.listingTitle}
                </p>
              )}
              <p className="truncate text-sm text-muted-foreground">
                {c.lastBody ?? t("noMessages")}
              </p>
            </div>
            {c.unread > 0 && (
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {c.unread}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
