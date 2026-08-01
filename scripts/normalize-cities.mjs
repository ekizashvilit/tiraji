// One-off: convert legacy city display strings to stable slugs.
// Covers both listings.city and profiles.city.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

// Georgian (and a few English) legacy names → canonical slug.
const MAP = {
  თბილისი: "tbilisi",
  Tbilisi: "tbilisi",
  ბათუმი: "batumi",
  Batumi: "batumi",
  ქუთაისი: "kutaisi",
  Kutaisi: "kutaisi",
  რუსთავი: "rustavi",
  გორი: "gori",
  ზუგდიდი: "zugdidi",
  ფოთი: "poti",
  ქობულეთი: "kobuleti",
  თელავი: "telavi",
  ოზურგეთი: "ozurgeti",
  ახალციხე: "akhaltsikhe",
  ზესტაფონი: "zestafoni",
  მარნეული: "marneuli",
};

for (const table of ["listings", "profiles"]) {
  for (const [from, to] of Object.entries(MAP)) {
    const res = await fetch(
      `${URL}/rest/v1/${table}?city=eq.${encodeURIComponent(from)}`,
      {
        method: "PATCH",
        headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify({ city: to }),
      },
    );
    console.log(
      `${table}: ${from} → ${to}: ${res.ok ? "ok" : `FAILED ${res.status} ${await res.text()}`}`,
    );
  }
}
