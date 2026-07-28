// Demo seed: creates a demo seller + a set of listings with real cover images.
// Run:  node --env-file=.env.local scripts/seed.mjs
//
// Uses the Supabase service role key (server-only) to bypass RLS.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DEMO_EMAIL = "demo.seller@tiraji.example";

const H = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
  "Content-Type": "application/json",
};

// title, author, genre slug, type, price (GEL, sale only), city
const BOOKS = [
  ["ვეფხისტყაოსანი", "შოთა რუსთაველი", "poetry", "sale", 18, "თბილისი"],
  ["დათა თუთაშხია", "ჭაბუა ამირეჯიბი", "fiction", "sale", 22, "თბილისი"],
  ["ჯაყოს ხიზნები", "მიხეილ ჯავახიშვილი", "fiction", "sale", 12, "ქუთაისი"],
  ["გველის პერანგი", "გრიგოლ რობაქიძე", "fiction", "swap", null, "თბილისი"],
  ["დიდოსტატის მარჯვენა", "კონსტანტინე გამსახურდია", "fiction", "sale", 15, "ბათუმი"],
  ["ადამიანთა შორის", "ნოდარ დუმბაძე", "fiction", "sale", 10, "თბილისი"],
  ["მე, ბებია, ილიკო და ილარიონი", "ნოდარ დუმბაძე", "fiction", "sale", 14, "თბილისი"],
  ["The Little Prince", "Antoine de Saint-Exupéry", "children", "sale", 9, "თბილისი"],
  ["1984", "George Orwell", "fiction", "sale", 16, "თბილისი"],
  ["Sapiens", "Yuval Noah Harari", "nonfiction", "sale", 28, "ბათუმი"],
  ["Crime and Punishment", "Fyodor Dostoevsky", "fiction", "sale", 20, "თბილისი"],
  ["The Master and Margarita", "Mikhail Bulgakov", "fiction", "swap", null, "ქუთაისი"],
  ["Norwegian Wood", "Haruki Murakami", "fiction", "sale", 24, "თბილისი"],
  ["The Alchemist", "Paulo Coelho", "fiction", "giveaway", null, "თბილისი"],
  ["Thinking, Fast and Slow", "Daniel Kahneman", "nonfiction", "sale", 30, "თბილისი"],
  ["A Brief History of Time", "Stephen Hawking", "sci-tech", "sale", 26, "ბათუმი"],
  ["Meditations", "Marcus Aurelius", "nonfiction", "sale", 13, "თბილისი"],
  ["The Hobbit", "J.R.R. Tolkien", "fiction", "sale", 19, "თბილისი"],
  ["Harry Potter and the Philosopher's Stone", "J.K. Rowling", "children", "sale", 21, "თბილისი"],
  ["Cosmos", "Carl Sagan", "sci-tech", "swap", null, "თბილისი"],
  ["Steve Jobs", "Walter Isaacson", "nonfiction", "sale", 25, "ბათუმი"],
  ["The Republic", "Plato", "academic", "sale", 17, "თბილისი"],
  ["Guns, Germs, and Steel", "Jared Diamond", "history", "sale", 23, "ქუთაისი"],
  ["Pride and Prejudice", "Jane Austen", "fiction", "giveaway", null, "თბილისი"],
  ["The Old Man and the Sea", "Ernest Hemingway", "fiction", "sale", 11, "თბილისი"],
  ["Man's Search for Meaning", "Viktor Frankl", "nonfiction", "sale", 15, "თბილისი"],
  ["Educated", "Tara Westover", "nonfiction", "sale", 22, "ბათუმი"],
  ["The Art of War", "Sun Tzu", "history", "giveaway", null, "თბილისი"],
];

async function fetchCover(title, author) {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(
        title,
      )}&author=${encodeURIComponent(author)}&limit=1&fields=cover_i`,
    );
    const json = await res.json();
    const coverId = json?.docs?.[0]?.cover_i;
    return coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null;
  } catch {
    return null;
  }
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
    body: JSON.stringify({ display_name: "ტირაჟი (დემო)", city: "თბილისი" }),
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
      swap_wanted:
        type === "swap" ? "ნებისმიერი ქართული პროზა" : null,
      city,
      book_language: /[a-zA-Z]/.test(title) ? "English" : "ქართული",
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
