// Deterministic book-spine gradient for listings with no photo. Colours are
// drawn from the site's warm palette (espresso, terracotta, olive, ochre,
// browns) so placeholders feel like part of the theme rather than random.
const SPINES = [
  "linear-gradient(150deg,#4A3428,#6B4A38)", // espresso
  "linear-gradient(150deg,#B4551F,#8F4319)", // terracotta
  "linear-gradient(150deg,#6E7B4E,#54603B)", // olive
  "linear-gradient(150deg,#A9722E,#835725)", // ochre
  "linear-gradient(150deg,#5C4033,#3D2A22)", // deep brown
  "linear-gradient(150deg,#8A6A4F,#5F4A38)", // warm taupe
] as const;

export function spineFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SPINES[hash % SPINES.length];
}
