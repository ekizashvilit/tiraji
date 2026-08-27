"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { isClean } from "@/lib/profanity";
import { useRouter } from "@/i18n/navigation";
import { CITIES, cityLabel } from "@/lib/cities";
import { LANGUAGES, languageLabel } from "@/lib/languages";
import { genreName } from "@/lib/listings-format";
import {
  SELLABLE_TYPES,
  CREATABLE_TYPES,
  BOOK_CONDITIONS,
} from "@/lib/listing-constants";
import type {
  GenreRow,
  ListingType,
  BookCondition,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePhotos } from "@/components/sell/use-photos";
import { PhotoGrid } from "@/components/sell/photo-grid";
import { cn } from "@/lib/utils";

// Fields the form can edit on an existing listing.
export type EditableListing = {
  id: string;
  listing_type: ListingType;
  title: string;
  author: string | null;
  condition: BookCondition | null;
  price: number | null;
  is_negotiable: boolean;
  swap_wanted: string | null;
  city: string | null;
  book_language: string | null;
  genre_id: number | null;
  cover_image_paths: string[];
};

export function SellForm({
  genres,
  defaultCity,
  defaultType,
  listing,
  onTypeChange,
}: {
  genres: GenreRow[];
  defaultCity: string;
  defaultType: ListingType;
  listing?: EditableListing;
  // Notified when the seller switches type, so a parent can react (e.g. update
  // the page heading). The form still owns the type internally.
  onTypeChange?: (type: ListingType) => void;
}) {
  const t = useTranslations("sell");
  const tw = useTranslations("wanted");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = !!listing;

  const [listingType, setListingType] = useState<ListingType>(
    listing?.listing_type ?? defaultType,
  );
  const isWanted = listingType === "wanted";
  const [title, setTitle] = useState(listing?.title ?? "");
  const [author, setAuthor] = useState(listing?.author ?? "");
  const [condition, setCondition] = useState<BookCondition | "">(
    listing?.condition ?? "",
  );
  const [price, setPrice] = useState(
    listing?.price != null ? String(listing.price) : "",
  );
  const [isNegotiable, setIsNegotiable] = useState(
    listing?.is_negotiable ?? false,
  );
  const [swapWanted, setSwapWanted] = useState(listing?.swap_wanted ?? "");
  const [city, setCity] = useState(listing?.city ?? defaultCity);
  const [bookLanguage, setBookLanguage] = useState(
    listing?.book_language ?? "ka",
  );
  const [genreId, setGenreId] = useState(
    listing?.genre_id != null ? String(listing.genre_id) : "",
  );
  const { photos, checking, full, addPhotos, removePhoto, upload } = usePhotos(
    listing?.cover_image_paths ?? [],
  );

  // Wanted-only free-text notes (wanted posts have no photos/condition/genre).
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  // title is required for every type; author + city are required for wanted.
  const [errors, setErrors] = useState<{
    title?: string;
    author?: string;
    city?: string;
  }>({});
  const [formError, setFormError] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const next: typeof errors = {};
    if (!title.trim())
      next.title = isWanted ? tw("titleRequired") : t("errorTitle");
    if (isWanted && !author.trim()) next.author = tw("authorRequired");
    if (isWanted && !city) next.city = tw("cityRequired");
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});

    // Screen the free-text fields for offensive language before publishing.
    const text = [title, author, isWanted ? description : swapWanted]
      .filter(Boolean)
      .join(" ");
    if (!isClean(text)) {
      setFormError(t("errorProfanity"));
      return;
    }
    setFormError(undefined);

    setSubmitting(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      router.push("/?auth=required");
      return;
    }

    // Wanted posts skip photos/condition/genre and land on the new listing
    // (they're only ever created, never edited, through this form).
    if (isWanted) {
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
          is_negotiable: false,
          swap_wanted: null,
          city: city || null,
          book_language: null,
          genre_id: null,
          isbn: null,
          cover_external_url: null,
          cover_image_paths: [],
        })
        .select("id")
        .single<{ id: string }>();
      setSubmitting(false);
      if (error || !data) {
        toast.error(tw("saveError"));
        return;
      }
      toast.success(tw("savedPublic"));
      router.push(`/book/${data.id}`);
      return;
    }

    // Upload only the newly-added photos; existing ones keep their paths.
    let coverPaths: string[];
    let retainedPaths: string[];
    try {
      ({ coverPaths, retainedPaths } = await upload(supabase, user.id));
    } catch {
      setSubmitting(false);
      toast.error(t("errorUpload"));
      return;
    }

    const fields = {
      listing_type: listingType,
      title: title.trim(),
      author: author.trim() || null,
      condition: condition || null,
      price:
        listingType === "sale" && !isNegotiable && price.trim()
          ? Number(price)
          : null,
      is_negotiable: listingType === "sale" ? isNegotiable : false,
      swap_wanted: listingType === "swap" ? swapWanted.trim() || null : null,
      city: city || null,
      book_language: bookLanguage || null,
      genre_id: genreId ? Number(genreId) : null,
      cover_image_paths: coverPaths,
    };

    const { error } = isEdit
      ? await supabase.from("listings").update(fields).eq("id", listing!.id)
      : await supabase.from("listings").insert({
          seller_id: user.id,
          description: null,
          isbn: null,
          cover_external_url: null,
          ...fields,
        });

    if (error) {
      setSubmitting(false);
      toast.error(t("errorGeneric"));
      return;
    }

    // On edit, delete any cover files the seller removed so they don't orphan.
    if (isEdit) {
      const removed = listing!.cover_image_paths.filter(
        (p) => !retainedPaths.includes(p),
      );
      if (removed.length) {
        await supabase.storage.from("covers").remove(removed);
      }
    }

    setSubmitting(false);
    toast.success(isEdit ? t("updated") : t("published"));
    router.push("/my-listings");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8" noValidate>
      {/* Listing type */}
      <div className="space-y-2">
        <Label>{t("type")}</Label>
        <div
          className={cn(
            "grid gap-2",
            isEdit ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
          )}
        >
          {(isEdit ? SELLABLE_TYPES : CREATABLE_TYPES).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={listingType === type}
              onClick={() => {
                setListingType(type);
                onTypeChange?.(type);
              }}
              className={cn(
                "rounded-lg border px-3 py-3 text-[0.95rem] font-semibold transition-colors",
                listingType === type
                  ? "border-primary bg-accent text-primary"
                  : "border-border hover:bg-muted",
              )}
            >
              {t(`type_${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Title (required) */}
      <div className="space-y-2">
        <Label htmlFor="title">{t("title")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder={t("titlePlaceholder")}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <FieldError id="title-error" message={errors.title} />
      </div>

      {/* Author */}
      <div className="space-y-2">
        <Label htmlFor="author">{t("author")}</Label>
        <Input
          id="author"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
            setErrors((prev) => ({ ...prev, author: undefined }));
          }}
          placeholder={t("authorPlaceholder")}
          aria-invalid={!!errors.author}
          aria-describedby={errors.author ? "author-error" : undefined}
        />
        <FieldError id="author-error" message={errors.author} />
      </div>

      {/* Condition + Genre (not on wanted posts) */}
      {!isWanted && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="condition">{t("condition")}</Label>
            <Select
              id="condition"
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as BookCondition | "")
              }
              className="h-11"
            >
              <option value="">{t("conditionPlaceholder")}</option>
              {BOOK_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {t(`cond_${c}`)}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">{t("genre")}</Label>
            <Select
              id="genre"
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="h-11"
            >
              <option value="">{t("genrePlaceholder")}</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {genreName(g, locale)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* City (always) + Language (not on wanted posts) */}
      <div className={cn("grid gap-6", !isWanted && "sm:grid-cols-2")}>
        <div className="space-y-2">
          <Label htmlFor="city">{t("city")}</Label>
          <Select
            id="city"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setErrors((prev) => ({ ...prev, city: undefined }));
            }}
            className="h-11"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "city-error" : undefined}
          >
            <option value="">{t("cityPlaceholder")}</option>
            {CITIES.map((c) => (
              <option key={c.code} value={c.code}>
                {cityLabel(c.code, locale)}
              </option>
            ))}
          </Select>
          <FieldError id="city-error" message={errors.city} />
        </div>

        {!isWanted && (
          <div className="space-y-2">
            <Label htmlFor="language">{t("language")}</Label>
            <Select
              id="language"
              value={bookLanguage}
              onChange={(e) => setBookLanguage(e.target.value)}
              className="h-11"
            >
              <option value="">{t("languagePlaceholder")}</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {languageLabel(l.code, locale)}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Price (sale only) */}
      {listingType === "sale" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="space-y-2">
            <Label htmlFor="price">{t("price")}</Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              min={0}
              value={isNegotiable ? "" : price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isNegotiable}
              placeholder={t("pricePlaceholder")}
              className="max-w-40"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="negotiable" className="text-base font-normal">
              {t("negotiable")}
            </Label>
            <Switch
              id="negotiable"
              checked={isNegotiable}
              onCheckedChange={setIsNegotiable}
            />
          </div>
        </div>
      )}

      {/* Budget (wanted only) — what the requester is willing to pay */}
      {isWanted && (
        <div className="space-y-2">
          <Label htmlFor="price">{tw("priceLabel")}</Label>
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={tw("pricePlaceholder")}
            className="max-w-40"
          />
        </div>
      )}

      {/* Swap wanted (swap only) */}
      {listingType === "swap" && (
        <div className="space-y-2">
          <Label htmlFor="swapWanted">{t("swapWanted")}</Label>
          <Textarea
            id="swapWanted"
            value={swapWanted}
            onChange={(e) => setSwapWanted(e.target.value)}
            placeholder={t("swapWantedPlaceholder")}
            rows={2}
          />
        </div>
      )}

      {/* Notes (wanted only) — edition, condition, anything else sought */}
      {isWanted && (
        <div className="space-y-2">
          <Label htmlFor="description">{tw("descLabel")}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tw("descPlaceholder")}
            rows={4}
            maxLength={1000}
          />
        </div>
      )}

      {/* Photos (not on wanted posts) */}
      {!isWanted && (
        <div className="space-y-2">
          <Label>{t("photos")}</Label>
          <p className="text-sm text-muted-foreground">{t("photosHint")}</p>
          <PhotoGrid
            photos={photos}
            checking={checking}
            full={full}
            onAdd={addPhotos}
            onRemove={removePhoto}
          />
        </div>
      )}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" size="lg" disabled={submitting} className="gap-2">
        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {submitting
          ? isEdit
            ? t("saving")
            : t("publishing")
          : isEdit
            ? t("save")
            : t("publish")}
      </Button>
    </form>
  );
}
