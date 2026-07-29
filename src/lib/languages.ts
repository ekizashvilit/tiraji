// Book languages stored as stable codes; rendered with a localized label.
// Client-safe (no server imports) so filter UI can use it directly.
export const LANGUAGES: { code: string; ka: string; en: string }[] = [
  { code: "ka", ka: "ქართული", en: "Georgian" },
  { code: "en", ka: "ინგლისური", en: "English" },
  { code: "ru", ka: "რუსული", en: "Russian" },
  { code: "de", ka: "გერმანული", en: "German" },
  { code: "fr", ka: "ფრანგული", en: "French" },
  { code: "es", ka: "ესპანური", en: "Spanish" },
  { code: "it", ka: "იტალიური", en: "Italian" },
  { code: "hy", ka: "სომხური", en: "Armenian" },
  { code: "az", ka: "აზერბაიჯანული", en: "Azerbaijani" },
  { code: "tr", ka: "თურქული", en: "Turkish" },
  { code: "other", ka: "სხვა", en: "Other" },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function languageLabel(code: string, locale: string): string {
  const l = BY_CODE.get(code);
  if (l) return locale === "en" ? l.en : l.ka;
  return code; // fallback for any unmapped/legacy value
}
