// Demo seed: creates a demo seller + a set of listings with real cover images.
// Run:  node --env-file=.env.local scripts/seed.mjs
//
// Uses the Supabase service role key (server-only) to bypass RLS.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const DEMO_EMAIL = "demo.seller@tiraji.example";

const H = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
  "Content-Type": "application/json",
};

// title, author, genre slug, type, price (GEL, sale only), city
//
// Georgian titles are matched against sulakauri.ge (a Georgian publisher) for
// real ქართული covers — OpenLibrary/Google Books have essentially no Georgian
// cover art. Each Georgian title below was verified to resolve to a correct,
// title-matched cover there; keep new ones to books sulakauri actually sells.
const BOOKS = [
  ["ვეფხისტყაოსანი", "შოთა რუსთაველი", "poetry", "sale", 25, "tbilisi"],
  [
    "დანაშაული და სასჯელი",
    "ფიოდორ დოსტოევსკი",
    "fiction",
    "sale",
    30,
    "tbilisi",
  ],
  ["მოხუცი და ზღვა", "ერნესტ ჰემინგუეი", "fiction", "sale", 14, "batumi"],
  ["ალქიმიკოსი", "პაულო კოელიო", "fiction", "sale", 18, "tbilisi"],
  ["რობინზონ კრუზო", "დანიელ დეფო", "children", "sale", 16, "kutaisi"],
  [
    "ტომ სოიერის თავგადასავალი",
    "მარკ ტვენი",
    "children",
    "sale",
    17,
    "tbilisi",
  ],
  [
    "პატარა პრინცი",
    "ანტუან დე სент-ეგზიუპერი",
    "children",
    "sale",
    15,
    "tbilisi",
  ],
  ["იდიოტი", "ფიოდორ დოსტოევსკი", "fiction", "swap", null, "tbilisi"],
  ["ძმები კარამაზოვები", "ფიოდორ დოსტოევსკი", "fiction", "sale", 35, "batumi"],
  ["ჯინსების თაობა", "დათო ტურაშვილი", "fiction", "sale", 20, "tbilisi"],
  ["სანტა ესპერანსა", "აკა მორჩილაძე", "fiction", "sale", 24, "tbilisi"],
  [
    "ლიტერატურული ექსპრესი",
    "ლაშა ბუღაძე",
    "fiction",
    "giveaway",
    null,
    "tbilisi",
  ],
  ["მატილდა", "როალდ დალი", "children", "sale", 19, "kutaisi"],
  ["პეპი გრძელწინდა", "ასტრიდ ლინდგრენი", "children", "sale", 16, "tbilisi"],
  [
    "The Little Prince",
    "Antoine de Saint-Exupéry",
    "children",
    "sale",
    9,
    "tbilisi",
  ],
  ["1984", "George Orwell", "fiction", "sale", 16, "tbilisi"],
  ["Sapiens", "Yuval Noah Harari", "nonfiction", "sale", 28, "batumi"],
  [
    "Crime and Punishment",
    "Fyodor Dostoevsky",
    "fiction",
    "sale",
    20,
    "tbilisi",
  ],
  [
    "The Master and Margarita",
    "Mikhail Bulgakov",
    "fiction",
    "swap",
    null,
    "kutaisi",
  ],
  ["Norwegian Wood", "Haruki Murakami", "fiction", "sale", 24, "tbilisi"],
  ["The Alchemist", "Paulo Coelho", "fiction", "giveaway", null, "tbilisi"],
  [
    "Thinking, Fast and Slow",
    "Daniel Kahneman",
    "nonfiction",
    "sale",
    30,
    "tbilisi",
  ],
  [
    "A Brief History of Time",
    "Stephen Hawking",
    "sci-tech",
    "sale",
    26,
    "batumi",
  ],
  ["Meditations", "Marcus Aurelius", "nonfiction", "sale", 13, "tbilisi"],
  ["The Hobbit", "J.R.R. Tolkien", "fiction", "sale", 19, "tbilisi"],
  [
    "Harry Potter and the Philosopher's Stone",
    "J.K. Rowling",
    "children",
    "sale",
    21,
    "tbilisi",
  ],
  ["Cosmos", "Carl Sagan", "sci-tech", "swap", null, "tbilisi"],
  ["Steve Jobs", "Walter Isaacson", "nonfiction", "sale", 25, "batumi"],
  ["The Republic", "Plato", "academic", "sale", 17, "tbilisi"],
  ["Guns, Germs, and Steel", "Jared Diamond", "history", "sale", 23, "kutaisi"],
  [
    "Pride and Prejudice",
    "Jane Austen",
    "fiction",
    "giveaway",
    null,
    "tbilisi",
  ],
  [
    "The Old Man and the Sea",
    "Ernest Hemingway",
    "fiction",
    "sale",
    11,
    "tbilisi",
  ],
  [
    "Man's Search for Meaning",
    "Viktor Frankl",
    "nonfiction",
    "sale",
    15,
    "tbilisi",
  ],
  ["Educated", "Tara Westover", "nonfiction", "sale", 22, "batumi"],
  ["The Art of War", "Sun Tzu", "history", "giveaway", null, "tbilisi"],
];

// Latin titles → OpenLibrary (good English coverage). Georgian → sulakauri.ge.
async function fetchCover(title, author) {
  return /[a-zA-Z]/.test(title)
    ? fetchCoverOpenLibrary(title, author)
    : fetchCoverSulakauri(title);
}

async function fetchCoverOpenLibrary(title, author) {
  // Try title+author first, then title-only — OpenLibrary stores non-Latin
  // authors transliterated, so the stricter query often misses.
  for (const q of [
    `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`,
    `title=${encodeURIComponent(title)}`,
  ]) {
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?${q}&limit=1&fields=cover_i`,
      );
      const json = await res.json();
      const coverId = json?.docs?.[0]?.cover_i;
      if (coverId)
        return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    } catch {
      // try the next query shape
    }
  }
  return null;
}

// Strip punctuation/whitespace/HTML entities so titles compare cleanly.
function normalizeTitle(s) {
  return (s || "")
    .replace(/&#\d+;/g, "")
    .replace(/[\s"“”.,:;!?()[\]\-–—’']+/g, "")
    .toLowerCase();
}

// Scrape sulakauri.ge search for the cover of a Georgian book. Their search
// falls back to unrelated "recommended" products when nothing matches, so we
// accept a card's cover ONLY if its alt-title strictly matches the query
// (equal, or one is a prefix of the other) — never the first card blindly.
async function fetchCoverSulakauri(title) {
  try {
    const res = await fetch(
      `https://sulakauri.ge/?s=${encodeURIComponent(title)}&post_type=product`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 AppleWebKit/537.36",
          "Accept-Language": "ka",
        },
      },
    );
    const html = await res.text();
    const nq = normalizeTitle(title);
    const imgTags =
      html.match(/<img[^>]*class="product-card-image"[^>]*>/g) ?? [];
    for (const tag of imgTags) {
      const src = tag.match(/src="([^"]+)"/)?.[1];
      const alt = tag.match(/alt="([^"]*)"/)?.[1];
      if (!src || !alt) continue;
      const na = normalizeTitle(alt);
      const match =
        na === nq ||
        (na.startsWith(nq) && nq.length >= 6) ||
        (nq.startsWith(na) && na.length >= 6);
      if (match) return src;
    }
  } catch {
    // fall through to no cover
  }
  return null;
}

async function ensureDemoUser() {
  // Try to create; if it exists, look it up.
  const createRes = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      email: DEMO_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: "ტირაჟი (დემო)" },
    }),
  });
  if (createRes.ok) {
    const u = await createRes.json();
    return u.id;
  }
  // Already exists — find it.
  const listRes = await fetch(
    `${URL}/auth/v1/admin/users?page=1&per_page=200`,
    { headers: H },
  );
  const list = await listRes.json();
  const users = list.users ?? list;
  const found = users.find((u) => u.email === DEMO_EMAIL);
  if (!found) throw new Error("Could not create or find demo user");
  return found.id;
}

async function main() {
  console.log("→ Ensuring demo seller…");
  const sellerId = await ensureDemoUser();

  // Update profile with a friendly name + city.
  await fetch(`${URL}/rest/v1/profiles?id=eq.${sellerId}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ display_name: "ტირაჟი (დემო)", city: "tbilisi" }),
  });

  // Load genres → slug->id map.
  const genresRes = await fetch(`${URL}/rest/v1/genres?select=id,slug`, {
    headers: H,
  });
  const genres = await genresRes.json();
  const genreId = Object.fromEntries(genres.map((g) => [g.slug, g.id]));

  // Clear previous demo listings (idempotent).
  await fetch(`${URL}/rest/v1/listings?seller_id=eq.${sellerId}`, {
    method: "DELETE",
    headers: { ...H, Prefer: "return=minimal" },
  });

  console.log(`→ Fetching covers + building ${BOOKS.length} listings…`);
  const rows = [];
  for (const [title, author, slug, type, price, city] of BOOKS) {
    const cover = await fetchCover(title, author);
    rows.push({
      seller_id: sellerId,
      listing_type: type,
      title,
      author,
      description: null,
      condition: ["new", "like_new", "good", "worn"][
        Math.floor(rows.length % 4)
      ],
      price: type === "sale" ? price : null,
      is_negotiable: type === "sale" && rows.length % 3 === 0,
      swap_wanted: type === "swap" ? "ნებისმიერი ქართული პროზა" : null,
      city,
      book_language: /[a-zA-Z]/.test(title) ? "en" : "ka",
      genre_id: genreId[slug] ?? null,
      cover_external_url: cover,
    });
  }

  const insertRes = await fetch(`${URL}/rest/v1/listings`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });

  if (!insertRes.ok) {
    console.error("Insert failed:", insertRes.status, await insertRes.text());
    process.exit(1);
  }

  const withCover = rows.filter((r) => r.cover_external_url).length;
  console.log(
    `✓ Inserted ${rows.length} listings (${withCover} with cover images).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
