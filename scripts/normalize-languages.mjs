// One-off: convert legacy book_language display strings to stable codes.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const MAP = {
  English: "en",
  ქართული: "ka",
  Georgian: "ka",
  Russian: "ru",
  რუსული: "ru",
};

for (const [from, to] of Object.entries(MAP)) {
  const res = await fetch(
    `${URL}/rest/v1/listings?book_language=eq.${encodeURIComponent(from)}`,
    {
      method: "PATCH",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ book_language: to }),
    },
  );
  console.log(`${from} → ${to}: ${res.ok ? "ok" : `FAILED ${res.status} ${await res.text()}`}`);
}
