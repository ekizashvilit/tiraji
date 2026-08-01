"use client";

import { useId } from "react";

// Small inline-SVG flags for the locale switcher. Inlined on purpose: flag
// emoji don't render on Windows, and inline SVG avoids adding image assets or
// touching next/image config. Decorative (aria-hidden) — the language name
// beside it carries the meaning.
const BOLNISI_CROSSES: [number, number][] = [
  [6.25, 3.75],
  [23.75, 3.75],
  [6.25, 16.25],
  [23.75, 16.25],
];

export function Flag({
  locale,
  className = "h-4 w-6 shrink-0 rounded-xs",
}: {
  locale: string;
  className?: string;
}) {
  const id = useId();

  if (locale === "ka") {
    // Georgian five-cross flag: red St George's cross + a small cross per quadrant.
    return (
      <svg viewBox="0 0 30 20" className={className} role="img" aria-hidden>
        <rect width="30" height="20" fill="#fff" />
        <rect x="12.5" width="5" height="20" fill="#ff0000" />
        <rect y="7.5" width="30" height="5" fill="#ff0000" />
        {BOLNISI_CROSSES.map(([cx, cy]) => (
          <g key={`${cx}-${cy}`} fill="#ff0000">
            <rect x={cx - 2} y={cy - 0.7} width="4" height="1.4" />
            <rect x={cx - 0.7} y={cy - 2} width="1.4" height="4" />
          </g>
        ))}
      </svg>
    );
  }

  if (locale === "en") {
    // Union Jack. clipPath ids are unique per instance so multiple flags in the
    // DOM don't cross-reference each other.
    return (
      <svg viewBox="0 0 60 30" className={className} role="img" aria-hidden>
        <clipPath id={`${id}-s`}>
          <path d="M0,0 v30 h60 v-30 z" />
        </clipPath>
        <clipPath id={`${id}-t`}>
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <g clipPath={`url(#${id}-s)`}>
          <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path
            d="M0,0 L60,30 M60,0 L0,30"
            clipPath={`url(#${id}-t)`}
            stroke="#c8102e"
            strokeWidth="4"
          />
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
        </g>
      </svg>
    );
  }

  return null;
}
