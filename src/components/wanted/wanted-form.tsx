"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { CITIES, cityLabel } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";

// Post a book you're looking for: creates a listings row (type=wanted) shown on
// the Wanted board so others can offer it. "Email me when it's listed" is a
// separate feature (book alerts at /account/alerts).
export function WantedForm() {
  const t = useTranslations("wanted");
  const tf = useTranslations("filters");
  const locale = useLocale();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  // Required: title, author, city. Optional: price, description.
  const [errors, setErrors] = useState<{
    title?: string;
    author?: string;
    city?: string;
  }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const next: typeof errors = {};
    if (!title.trim()) next.title = t("titleRequired");
    if (!author.trim()) next.author = t("authorRequired");
    if (!city) next.city = t("cityRequired");
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/?auth=required");
      return;
    }

    setSaving(true);

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
        genre_id: null,
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
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="w-title">{t("titleLabel")}</Label>
        <Input
          id="w-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder={t("titlePlaceholder")}
          maxLength={200}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "w-title-error" : undefined}
        />
        <FieldError id="w-title-error" message={errors.title} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="w-author">{t("authorLabel")}</Label>
        <Input
          id="w-author"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
            setErrors((prev) => ({ ...prev, author: undefined }));
          }}
          placeholder={t("authorPlaceholder")}
          maxLength={200}
          aria-invalid={!!errors.author}
          aria-describedby={errors.author ? "w-author-error" : undefined}
        />
        <FieldError id="w-author-error" message={errors.author} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
          <Select
            id="w-city"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setErrors((prev) => ({ ...prev, city: undefined }));
            }}
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "w-city-error" : undefined}
          >
            <option value="">{t("cityPlaceholder")}</option>
            {CITIES.map((c) => (
              <option key={c.code} value={c.code}>
                {cityLabel(c.code, locale)}
              </option>
            ))}
          </Select>
          <FieldError id="w-city-error" message={errors.city} />
        </div>
      </div>
      <div className="space-y-1.5">
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

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 sm:w-auto"
        disabled={saving}
      >
        {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t("submit")}
      </Button>
    </form>
  );
}
