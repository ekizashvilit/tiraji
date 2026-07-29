// Georgian cities stored as stable slugs; rendered with a localized label.
// Client-safe (no server imports) so both the profile form and the search
// facet can use it directly. Ordered by population (largest first); "other" last.
export const CITIES: { code: string; ka: string; en: string }[] = [
  { code: "tbilisi", ka: "თბილისი", en: "Tbilisi" },
  { code: "batumi", ka: "ბათუმი", en: "Batumi" },
  { code: "kutaisi", ka: "ქუთაისი", en: "Kutaisi" },
  { code: "rustavi", ka: "რუსთავი", en: "Rustavi" },
  { code: "gori", ka: "გორი", en: "Gori" },
  { code: "zugdidi", ka: "ზუგდიდი", en: "Zugdidi" },
  { code: "poti", ka: "ფოთი", en: "Poti" },
  { code: "samtredia", ka: "სამტრედია", en: "Samtredia" },
  { code: "khashuri", ka: "ხაშური", en: "Khashuri" },
  { code: "senaki", ka: "სენაკი", en: "Senaki" },
  { code: "zestafoni", ka: "ზესტაფონი", en: "Zestafoni" },
  { code: "marneuli", ka: "მარნეული", en: "Marneuli" },
  { code: "telavi", ka: "თელავი", en: "Telavi" },
  { code: "kobuleti", ka: "ქობულეთი", en: "Kobuleti" },
  { code: "akhaltsikhe", ka: "ახალციხე", en: "Akhaltsikhe" },
  { code: "ozurgeti", ka: "ოზურგეთი", en: "Ozurgeti" },
  { code: "kaspi", ka: "კასპი", en: "Kaspi" },
  { code: "chiatura", ka: "ჭიათურა", en: "Chiatura" },
  { code: "tsqaltubo", ka: "წყალტუბო", en: "Tsqaltubo" },
  { code: "sagarejo", ka: "საგარეჯო", en: "Sagarejo" },
  { code: "other", ka: "სხვა", en: "Other" },
];

const BY_CODE = new Map(CITIES.map((c) => [c.code, c]));

export function cityLabel(code: string, locale: string): string {
  const c = BY_CODE.get(code);
  if (c) return locale === "en" ? c.en : c.ka;
  return code; // fallback for any unmapped/legacy value
}
