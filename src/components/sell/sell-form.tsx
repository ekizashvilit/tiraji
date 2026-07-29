"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { CITIES, cityLabel } from "@/lib/cities";
import { LANGUAGES, languageLabel } from "@/lib/languages";
import type { GenreRow, ListingType, BookCondition } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TYPES: ListingType[] = ["sale", "swap", "giveaway"];
const CONDITIONS: BookCondition[] = ["new", "like_new", "good", "worn"];
const MAX_PHOTOS = 3;

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

// Inlined (can't import from @/lib/genres — it pulls in the server Supabase client).
function genreName(genre: GenreRow, locale: string): string {
  return locale === "en" ? genre.name_en : genre.name_ka;
}

function publicCoverUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}`;
}

// A photo is either already uploaded (has a storage path) or newly picked (a File).
type Photo =
  | { kind: "existing"; path: string; url: string }
  | { kind: "new"; file: File; url: string };

export function SellForm({
  genres,
  defaultCity,
  defaultType,
  listing,
}: {
  genres: GenreRow[];
  defaultCity: string;
  defaultType: ListingType;
  listing?: EditableListing;
}) {
  const t = useTranslations("sell");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = !!listing;

  const [listingType, setListingType] = useState<ListingType>(
    listing?.listing_type ?? defaultType,
  );
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
  const [photos, setPhotos] = useState<Photo[]>(
    listing?.cover_image_paths.map((path) => ({
      kind: "existing" as const,
      path,
      url: publicCoverUrl(path),
    })) ?? [],
  );

  const [submitting, setSubmitting] = useState(false);

  function onAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(t("photosMax", { max: MAX_PHOTOS }));
      return;
    }
    const added: Photo[] = files.slice(0, room).map((file) => ({
      kind: "new",
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...added]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const photo = prev[index];
      if (photo.kind === "new") URL.revokeObjectURL(photo.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!title.trim()) {
      toast.error(t("errorTitle"));
      return;
    }
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

    // Upload only the newly-added photos; existing ones keep their paths.
    const newPaths: string[] = [];
    try {
      for (const photo of photos) {
        if (photo.kind !== "new") continue;
        const compressed = await imageCompression(photo.file, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
        const ext = (photo.file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(path, compressed, { contentType: compressed.type });
        if (uploadError) throw uploadError;
        newPaths.push(path);
      }
    } catch {
      setSubmitting(false);
      toast.error(t("errorUpload"));
      return;
    }

    const retainedPaths = photos
      .filter((p) => p.kind === "existing")
      .map((p) => (p as { path: string }).path);
    const coverPaths = [...retainedPaths, ...newPaths];

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
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8">
      {/* Listing type */}
      <div className="space-y-2">
        <Label>{t("type")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setListingType(type)}
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
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          className="h-11 bg-background"
        />
      </div>

      {/* Author */}
      <div className="space-y-2">
        <Label htmlFor="author">{t("author")}</Label>
        <Input
          id="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder={t("authorPlaceholder")}
          className="h-11 bg-background"
        />
      </div>

      {/* Condition + Genre */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="condition">{t("condition")}</Label>
          <Select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as BookCondition | "")}
            className="h-11"
          >
            <option value="">{t("conditionPlaceholder")}</option>
            {CONDITIONS.map((c) => (
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

      {/* City + Language */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">{t("city")}</Label>
          <Select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-11"
          >
            <option value="">{t("cityPlaceholder")}</option>
            {CITIES.map((c) => (
              <option key={c.code} value={c.code}>
                {cityLabel(c.code, locale)}
              </option>
            ))}
          </Select>
        </div>

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
              className="h-11 max-w-40 bg-background"
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

      {/* Photos */}
      <div className="space-y-2">
        <Label>{t("photos")}</Label>
        <p className="text-sm text-muted-foreground">{t("photosHint")}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((photo, i) => (
            <div
              key={photo.url}
              className="relative size-24 overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={t("removePhoto")}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-foreground/70 text-white hover:bg-foreground"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="grid size-24 cursor-pointer place-items-center gap-1 rounded-lg border border-dashed border-border p-2 text-center leading-tight text-muted-foreground hover:bg-muted">
              <ImagePlus className="size-6" aria-hidden />
              <span className="text-xs">{t("addPhotos")}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onAddPhotos}
                className="sr-only"
              />
            </label>
          )}
        </div>
      </div>

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
