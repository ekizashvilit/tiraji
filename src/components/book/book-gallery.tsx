"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

// Detail-page photo viewer: a large cover with thumbnail switching. Falls back
// to the deterministic book-spine placeholder when a listing has no photos.
export function BookGallery({
  images,
  title,
  author,
  spine,
}: {
  images: string[];
  title: string;
  author: string | null;
  spine: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded-xl border border-border p-6 text-white"
        style={{ backgroundImage: spine }}
      >
        {author && (
          <span className="line-clamp-2 text-sm uppercase tracking-wide text-white/75">
            {author}
          </span>
        )}
        <span className="line-clamp-6 text-2xl font-semibold leading-tight">
          {title}
        </span>
        <span className="h-px w-12 bg-white/40" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={images[active]}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 380px"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${title} — ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                i === active
                  ? "border-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
