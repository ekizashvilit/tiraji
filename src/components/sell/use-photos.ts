"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";

import { checkImageIsSafe } from "@/lib/nsfw";
import { coverPathUrl } from "@/lib/listings-format";
import type { Database } from "@/lib/supabase/types";

const MAX_PHOTOS = 3;
// Reject obviously-wrong files before compression/upload. This mirrors the
// server-side bucket limits (migration 0012) so the user gets instant feedback;
// the bucket constraints remain the real enforcement.
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // pre-compression ceiling

// A photo is either already uploaded (has a storage path) or newly picked (a File).
export type Photo =
  | { kind: "existing"; path: string; url: string }
  | { kind: "new"; file: File; url: string };

// Owns the sell form's photo list: local preview state, client-side validation
// + NSFW screening on add, and compress-then-upload on submit. Keeps SellForm
// focused on the listing fields themselves.
export function usePhotos(initialPaths: string[]) {
  const t = useTranslations("sell");
  const [photos, setPhotos] = useState<Photo[]>(() =>
    initialPaths.map((path) => ({
      kind: "existing" as const,
      path,
      url: coverPathUrl(path),
    })),
  );
  const [checking, setChecking] = useState(false);

  const full = photos.length >= MAX_PHOTOS;

  async function addPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(t("photosMax", { max: MAX_PHOTOS }));
      return;
    }

    // Drop unsupported types / oversized files up front (before compression).
    const candidates = files.slice(0, room);
    const valid = candidates.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_UPLOAD_BYTES,
    );
    if (valid.length < candidates.length) toast.error(t("photoInvalid"));
    if (!valid.length) return;

    // Screen each photo for explicit content before it's added (and later
    // uploaded). Runs entirely in the browser via NSFWJS.
    setChecking(true);
    const accepted: Photo[] = [];
    let rejected = 0;
    for (const file of valid) {
      let safe = true;
      try {
        safe = (await checkImageIsSafe(file)).safe;
      } catch {
        // If the model can't load, don't block the seller — the report button
        // and admin queue remain as a fallback.
        safe = true;
      }
      if (!safe) {
        rejected++;
        continue;
      }
      accepted.push({ kind: "new", file, url: URL.createObjectURL(file) });
    }
    setChecking(false);

    if (rejected > 0) toast.error(t("photoRejected"));
    if (accepted.length) setPhotos((prev) => [...prev, ...accepted]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const photo = prev[index];
      if (photo.kind === "new") URL.revokeObjectURL(photo.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  // Compress and upload the newly-picked photos, keeping existing ones by path.
  // Returns the final cover paths plus the retained (already-stored) ones, so
  // the caller can clean up any files the seller removed. Throws on upload error.
  async function upload(
    supabase: SupabaseClient<Database>,
    userId: string,
  ): Promise<{ coverPaths: string[]; retainedPaths: string[] }> {
    const newPaths: string[] = [];
    for (const photo of photos) {
      if (photo.kind !== "new") continue;
      const compressed = await imageCompression(photo.file, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const ext = (photo.file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(path, compressed, { contentType: compressed.type });
      if (uploadError) throw uploadError;
      newPaths.push(path);
    }

    const retainedPaths = photos
      .filter((p): p is Extract<Photo, { kind: "existing" }> => p.kind === "existing")
      .map((p) => p.path);
    return { coverPaths: [...retainedPaths, ...newPaths], retainedPaths };
  }

  return { photos, checking, full, addPhotos, removePhoto, upload } as const;
}
