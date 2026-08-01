"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import { cn } from "@/lib/utils";

const FADE = "4rem"; // width of the edge fade

// A horizontally-scrolling row powered by Embla: smooth momentum drag/swipe on
// every device, plus prev/next buttons on pointer (desktop) screens.
export function ScrollRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [emblaRef, embla] = useEmblaCarousel({
    dragFree: true, // free scroll with inertia, not slide-by-slide snapping
    align: "start",
    containScroll: "trimSnaps",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  // The edge fade is a desktop touch (paired with the arrow buttons); drop it on
  // mobile. Set in an effect so the first client render matches the server.
  const [fade, setFade] = useState(true);
  // Vertical span of the card's cover image, so the buttons sit over the
  // covers (like a carousel) rather than the whole card incl. the text.
  const [cover, setCover] = useState<{ top: number; height: number } | null>(
    null,
  );

  const onSelect = useCallback(() => {
    if (!embla) return;
    setCanLeft(embla.canScrollPrev());
    setCanRight(embla.canScrollNext());
  }, [embla]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const card = container?.firstElementChild as HTMLElement | undefined;
    const coverEl = card?.firstElementChild as HTMLElement | undefined;
    if (!container || !coverEl) return;
    const cc = container.getBoundingClientRect();
    const c = coverEl.getBoundingClientRect();
    setCover({ top: c.top - cc.top, height: c.height });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setFade(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!embla) return;
    // Defer the first sync to the next frame so it doesn't setState
    // synchronously inside the effect body (which cascades an extra render);
    // the layout is also settled by then, making the cover measurement exact.
    const raf = requestAnimationFrame(() => {
      onSelect();
      measure();
    });
    embla.on("select", onSelect);
    embla.on("scroll", onSelect);
    embla.on("reInit", () => {
      onSelect();
      measure();
    });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [embla, onSelect, measure]);

  // Page by roughly a viewport of slides at a time.
  const page = (dir: -1 | 1) => {
    if (!embla) return;
    const n = Math.max(1, embla.slidesInView().length);
    const target = embla.selectedScrollSnap() + dir * n;
    embla.scrollTo(target);
  };

  // Fade the actual content at whichever edge has more to scroll to. A single
  // clean transparent→opaque ramp per edge — no intermediate stops, so there's
  // no visible banding seam.
  const left = canLeft ? "transparent 0" : "black 0";
  const right = canRight ? "transparent 100%" : "black 100%";
  const mask = `linear-gradient(to right, ${left}, black ${FADE}, black calc(100% - ${FADE}), ${right})`;
  const buttonTop = cover ? cover.top + cover.height / 2 : undefined;

  return (
    <div className="relative">
      <div
        ref={emblaRef}
        style={fade ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
        className="-mx-4 overflow-hidden px-4 md:-mx-2 md:px-2"
      >
        <div ref={containerRef} className={cn("flex gap-1 pb-1", className)}>
          {children}
        </div>
      </div>

      {canLeft && (
        <ArrowButton side="left" top={buttonTop} onClick={() => page(-1)} />
      )}
      {canRight && (
        <ArrowButton side="right" top={buttonTop} onClick={() => page(1)} />
      )}
    </div>
  );
}

function ArrowButton({
  side,
  top,
  onClick,
}: {
  side: "left" | "right";
  top: number | undefined;
  onClick: () => void;
}) {
  const t = useTranslations("common");
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t(side === "left" ? "previous" : "next")}
      style={top != null ? { top } : undefined}
      className={cn(
        "absolute z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-primary shadow-md transition hover:bg-accent md:grid",
        top == null && "top-1/2",
        side === "left" ? "left-1" : "right-1",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
