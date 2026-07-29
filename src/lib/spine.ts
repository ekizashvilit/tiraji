// Deterministic "book spine" gradient for listings without a cover image.
// Shared by the card thumbnail and the detail-page gallery so a coverless
// book looks identical everywhere.
const SPINES = [
  "linear-gradient(150deg,#1f7a4d,#0f3f28)",
  "linear-gradient(150deg,#b4551f,#6d2f10)",
  "linear-gradient(150deg,#2563eb,#152f6b)",
  "linear-gradient(150deg,#7c3a55,#3f1c2c)",
  "linear-gradient(150deg,#0e7c86,#083f45)",
  "linear-gradient(150deg,#b08307,#6b4f04)",
];

export function spineFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SPINES[h % SPINES.length];
}
