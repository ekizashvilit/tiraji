"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BellPlus, Loader2, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { BookAlertRow } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Alert = Pick<BookAlertRow, "id" | "title" | "author" | "created_at">;

// Manage-your-alerts screen: add a new alert and remove existing ones. All
// reads/writes go through the browser client — book_alerts RLS scopes every
// row to its owner, so no server action is needed.
export function AlertsManager({
  initial,
  defaultTitle = "",
}: {
  initial: Alert[];
  defaultTitle?: string;
}) {
  const t = useTranslations("alerts");
  const [alerts, setAlerts] = useState<Alert[]>(initial);
  const [title, setTitle] = useState(defaultTitle);
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const canSubmit = title.trim() !== "" || author.trim() !== "";

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !canSubmit) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("book_alerts")
      .insert({
        user_id: user.id,
        title: title.trim() || null,
        author: author.trim() || null,
        isbn: null,
      })
      .select("id, title, author, created_at")
      .single<Alert>();
    setSaving(false);

    if (error || !data) {
      toast.error(t("saveError"));
      return;
    }
    setAlerts((prev) => [data, ...prev]);
    setTitle("");
    setAuthor("");
    toast.success(t("saved"));
  }

  async function onRemove(id: string) {
    if (removing) return;
    setRemoving(id);
    const supabase = createClient();
    const { error } = await supabase.from("book_alerts").delete().eq("id", id);
    setRemoving(null);

    if (error) {
      toast.error(t("removeError"));
      return;
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success(t("removed"));
  }

  return (
    <div className="space-y-8">
      {/* Add */}
      <form onSubmit={onAdd} className="rounded-xl border border-border bg-card p-5">
        <p className="font-semibold text-foreground">{t("addTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("promptBody")}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-alert-title">{t("titleLabel")}</Label>
            <Input
              id="new-alert-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-alert-author">{t("authorLabel")}</Label>
            <Input
              id="new-alert-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("authorPlaceholder")}
              maxLength={200}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="mt-4 w-full gap-2 sm:w-auto"
          disabled={saving || !canSubmit}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <BellPlus className="size-4" aria-hidden />
          )}
          {t("subscribe")}
        </Button>
      </form>

      {/* List */}
      <div>
        <h2 className="mb-3 text-lg font-bold">{t("yourAlerts")}</h2>
        {alerts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  {a.title && <p className="truncate font-medium text-foreground">{a.title}</p>}
                  {a.author && (
                    <p className="truncate text-sm text-muted-foreground">{a.author}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  disabled={removing === a.id}
                  aria-label={t("remove")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                >
                  {removing === a.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-4" aria-hidden />
                  )}
                  <span className="hidden sm:inline">{t("remove")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
