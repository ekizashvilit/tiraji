"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gift,
  Repeat,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Slide = {
  key: string;
  href: string;
  gradient: string;
  Icon: typeof BookOpen;
};

// Promotional banners — swap these for real campaign banners later.
const SLIDES: Slide[] = [
  {
    key: "b1",
    href: "/buy",
    gradient: "linear-gradient(120deg,#14532d 0%,#1f7a4d 60%,#2f9c66 100%)",
    Icon: BookOpen,
  },
  {
    key: "b2",
    href: "/swap",
    gradient: "linear-gradient(120deg,#152f6b 0%,#2563eb 60%,#4f83f2 100%)",
    Icon: Repeat,
  },
  {
    key: "b3",
    href: "/giveaway",
    gradient: "linear-gradient(120deg,#7a3d06 0%,#d97706 60%,#f0a53d 100%)",
    Icon: Gift,
  },
];

const AUTOPLAY_MS = 5500;

export function HeroCarousel() {
  const t = useTranslations("banners");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;

  const regionRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const dragXRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || dragging) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, dragging, count]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) movedRef.current = true;
    dragXRef.current = dx;
    setDragPx(dx);
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const dx = dragXRef.current;
    const width = regionRef.current?.offsetWidth ?? 1;
    const threshold = Math.min(120, width * 0.15);
    if (dx <= -threshold) go(1);
    else if (dx >= threshold) go(-1);
    dragXRef.current = 0;
    setDragPx(0);
  }

  // Suppress the click that follows a drag (so releasing over a CTA doesn't navigate).
  function onClickCapture(e: React.MouseEvent) {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  }

  return (
    <div
      ref={regionRef}
      className="group relative overflow-hidden rounded-2xl"
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Track */}
      <div
        className={cn(
          "flex cursor-grab select-none touch-pan-y active:cursor-grabbing",
          !dragging && "transition-transform duration-500 ease-out",
        )}
        style={{
          transform: `translateX(calc(-${index * 100}% + ${dragPx}px))`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.key}
            className="w-full shrink-0"
            aria-hidden={i !== index}
          >
            <div
              className="relative flex h-60 items-center overflow-hidden px-6 text-white sm:h-72 sm:px-14"
              style={{ backgroundImage: s.gradient }}
            >
              <s.Icon
                className="pointer-events-none absolute -bottom-8 -right-6 h-56 w-56 opacity-10 sm:h-64 sm:w-64"
                aria-hidden
              />
              <div className="relative max-w-lg space-y-3 sm:space-y-4">
                <h2 className="text-2xl font-bold leading-tight sm:text-4xl">
                  {t(`${s.key}Title`)}
                </h2>
                <p className="text-white/85 sm:text-lg">{t(`${s.key}Text`)}</p>
                <Link
                  href={s.href}
                  tabIndex={i === index ? 0 : -1}
                  className="inline-flex h-11 items-center rounded-md bg-white px-6 text-sm font-bold text-brand-dark shadow-sm transition-colors hover:bg-white/90"
                >
                  {t(`${s.key}Cta`)}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label={t("prev")}
        className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/40 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <ChevronLeft className="h-6 w-6" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label={t("next")}
        className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/40 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <ChevronRight className="h-6 w-6" aria-hidden />
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={t("goTo", { n: i + 1 })}
            aria-current={i === index}
            className={cn(
              "h-2.5 rounded-full bg-white transition-all",
              i === index ? "w-6 opacity-100" : "w-2.5 opacity-50 hover:opacity-80",
            )}
          />
        ))}
      </div>
    </div>
  );
}
