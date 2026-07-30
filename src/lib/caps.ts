// Deterministic uppercase for display text.
//
// JavaScript engines disagree on how `String.prototype.toUpperCase()` handles
// Georgian: Node/V8 maps mkhedruli → mtavruli, but some browsers (notably older
// iOS Safari) leave it unchanged. When that text is server-rendered and then
// hydrated, the two disagree and React throws a hydration mismatch.
//
// We map the Georgian letter range ourselves with a fixed offset so the result
// is identical on every engine. Latin/other scripts fall back to the normal
// (ASCII-stable) uppercasing.
const MKHEDRULI_START = 0x10d0; // ა
const MKHEDRULI_END = 0x10fa; // ჺ (covers the full modern + archaic letters)
const MTAVRULI_START = 0x1c90; // Ა

export function caps(input: string): string {
  let out = "";
  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    if (cp >= MKHEDRULI_START && cp <= MKHEDRULI_END) {
      out += String.fromCodePoint(MTAVRULI_START + (cp - MKHEDRULI_START));
    } else {
      out += ch.toUpperCase();
    }
  }
  return out;
}
