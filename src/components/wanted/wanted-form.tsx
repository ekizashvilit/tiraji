"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import type { GenreRow } from "@/lib/supabase/types";
import { CITIES, cityLabel } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Inlined to avoid pulling the server Supabase client (see search-filters).
function genreLabel(genre: GenreRow, locale: string): string {
  return locale === "en" ? genre.name_en : genre.name_ka;
}

type Visibility = "public" | "private";

// Post a book you're looking for. Two paths:
//   public  → a listings row (type=wanted) shown on the Wanted board, contactable
//   private → a book_alert (email-only, not shown anywhere)
export function WantedForm({ genres }: { genres: GenreRow[] }) {
  const t = useTranslations("wanted");
  const tf = useTranslations("filters");
  const locale = useLocale();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/?auth=required");
      return;
    }

    setSaving(true);

    if (visibility === "private") {
      // Private → just a book alert (email me when it's listed for sale).
      const { error } = await supabase.from("book_alerts").insert({
        user_id: user.id,
        title: title.trim() || null,
        author: author.trim() || null,
        isbn: null,
      });
      setSaving(false);
      if (error) {
        toast.error(t("saveError"));
        return;
      }
      toast.success(t("savedPrivate"));
      router.push("/account/alerts");
      return;
    }

    // Public → a wanted listing on the board.
    const { data, error } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        listing_type: "wanted",
        title: title.trim(),
        author: author.trim() || null,
        description: description.trim() || null,
        condition: null,
        price: price.trim() ? Number(price) : null,
        swap_wanted: null,
        city: city || null,
        book_language: null,
        genre_id: genre ? Number(genre) : null,
        isbn: null,
        cover_external_url: null,
      })
      .select("id")
      .single<{ id: string }>();
    setSaving(false);

    if (error || !data) {
      toast.error(t("saveError"));
      return;
    }
    toast.success(t("savedPublic"));
    router.push(`/book/${data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="w-title">{t("titleLabel")}</Label>
          <Input
            id="w-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-author">{t("authorLabel")}</Label>
          <Input
            id="w-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t("authorPlaceholder")}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-price">{t("priceLabel")}</Label>
          <Input
            id="w-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("pricePlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-city">{tf("city")}</Label>
          <Select id="w-city" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">{tf("any")}</option>
            {CITIES.map((c) => (
              <option key={c.code} value={c.code}>
                {cityLabel(c.code, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-genre">{tf("genre")}</Label>
          <Select id="w-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">{tf("any")}</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {genreLabel(g, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="w-desc">{t("descLabel")}</Label>
          <Textarea
            id="w-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descPlaceholder")}
            rows={4}
            maxLength={1000}
          />
        </div>
      </div>

      {/* Visibility choice */}
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-bold">{t("visibilityLabel")}</legend>
        {(["public", "private"] as Visibility[]).map((v) => (
          <label
            key={v}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
              visibility === v
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent/50",
            )}
          >
            <input
              type="radio"
              name="visibility"
              value={v}
              checked={visibility === v}
              onChange={() => setVisibility(v)}
              className="mt-1 accent-primary"
            />
            <span>
              <span className="block font-medium text-foreground">
                {t(v === "public" ? "publicLabel" : "privateLabel")}
              </span>
              <span className="block text-sm text-muted-foreground">
                {t(v === "public" ? "publicHint" : "privateHint")}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <Button type="submit" size="lg" className="w-full gap-2 sm:w-auto" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t("submit")}
      </Button>
    </form>
  );
}
