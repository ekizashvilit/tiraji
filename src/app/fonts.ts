import localFont from "next/font/local";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";

// FiraGO — humanist sans (free, OFL). Body + headings. Contains Georgian Mkhedruli + Latin.
export const firago = localFont({
  src: [
    { path: "../fonts/FiraGO-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/FiraGO-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/FiraGO-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/FiraGO-Heavy.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-firago",
  display: "swap",
});

// Noto Sans Georgian — fallback that provides Georgian CAPITALS (Mtavruli),
// which FiraGO lacks. Used automatically for uppercased Georgian text.
export const notoGeorgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  variable: "--font-noto-sans",
  display: "swap",
  weight: ["400", "500", "700"],
});

// Noto Serif Georgian — an elegant serif used for the brand wordmark. Supports
// Georgian Mkhedruli + Mtavruli (capitals), so the uppercased logo text renders.
export const notoSerifGeorgian = Noto_Serif_Georgian({
  subsets: ["georgian"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["500", "600", "700"],
});
