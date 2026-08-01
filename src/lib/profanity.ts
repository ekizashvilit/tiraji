// Profanity / slur blocklist for user-entered listing text (title, author,
// "swap wanted"). Runs in the browser when a listing is saved; offensive text
// is blocked before it's ever published. The report button + /admin queue are
// the fallback for anything this misses.
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO EDIT — just add or remove strings in the two arrays below.
//   • EXACT     — matched as a whole word only, so "assistant" is NOT caught by
//                 "ass". Use this for most terms.
//   • CONTAINS  — matched anywhere inside the text. Use ONLY for unambiguous
//                 slurs that never appear inside an innocent word, or you'll get
//                 false rejections (the classic "Scunthorpe problem").
// Matching is case-insensitive. Georgian has no letter case, so Georgian terms
// just need to be listed once.
//
// NOTE: the Georgian list is a small, deliberately-conservative starter. You're
// the native speaker — extend it with the terms you actually want blocked.
// ─────────────────────────────────────────────────────────────────────────────

const EXACT: string[] = [
  // English
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "shit",
  "bullshit",
  "bitch",
  "asshole",
  "cunt",
  "dick",
  "prick",
  "pussy",
  "slut",
  "whore",
  "bastard",
  "wanker",
  "twat",
  // Georgian (starter — please curate/extend)
  "ყლე",
  "ყლეა",
  "ბოზი",
  "ბოზები",
  "მუტელი",
  "ძუკნა",
  "მოვტყან",
  "ტყნაური",
];

const CONTAINS: string[] = [
  // Unambiguous slurs (matched anywhere). English examples:
  "nigger",
  "faggot",
  "retard",
];

const EXACT_SET = new Set(EXACT.map((w) => w.toLowerCase()));
const CONTAINS_LC = CONTAINS.map((w) => w.toLowerCase());

function normalize(text: string): string {
  // Lowercase and strip Latin diacritics; harmless for Georgian (no diacritics).
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

function tokenize(text: string): string[] {
  // Split on anything that isn't a letter or number — works for both the Latin
  // and Georgian alphabets via Unicode property escapes.
  return normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

// Returns the first offending term found, or null if the text is clean.
export function findProfanity(text: string): string | null {
  if (!text) return null;
  const norm = normalize(text);
  for (const bad of CONTAINS_LC) {
    if (norm.includes(bad)) return bad;
  }
  for (const token of tokenize(text)) {
    if (EXACT_SET.has(token)) return token;
  }
  return null;
}

export function isClean(text: string): boolean {
  return findProfanity(text) === null;
}
