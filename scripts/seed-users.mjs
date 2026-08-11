// Seed two extra demo sellers, each with a handful of listings + real covers.
// Run:  node --env-file=.env.local scripts/seed-users.mjs
//
// Idempotent per user: creates the auth user if missing, then replaces that
// user's own listings. Leaves the main demo seller (seed.mjs) untouched.
// Uses the Supabase service role key (server-only) to bypass RLS.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const H = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
  "Content-Type": "application/json",
};

// Each seller: a friendly profile + their books.
// book = [title, author, genre slug, type, price (GEL, sale only)]
const SELLERS = [
  {
    email: "nino.beridze@tiraji.example",
    name: "ნინო ბერიძე",
    city: "tbilisi",
    books: [
      ["ბახტრიონი", "ვაჟა-ფშაველა", "poetry", "sale", 14],
      ["მთვარის მოტაცება", "კონსტანტინე გამსახურდია", "fiction", "sale", 20],
      ["The Catcher in the Rye", "J.D. Salinger", "fiction", "sale", 17],
      ["To Kill a Mockingbird", "Harper Lee", "fiction", "giveaway", null],
      ["Brave New World", "Aldous Huxley", "fiction", "swap", null],
    ],
  },
  {
    email: "levan.kapanadze@tiraji.example",
    name: "ლევან კაპანაძე",
    city: "batumi",
    books: [
      ["ბაში-აჩუკი", "აკაკი წერეთელი", "fiction", "sale", 12],
      ["გამრიგე", "ოთარ ჭილაძე", "fiction", "sale", 24],
      ["The Great Gatsby", "F. Scott Fitzgerald", "fiction", "sale", 18],
      ["Fahrenheit 451", "Ray Bradbury", "sci-tech", "sale", 16],
      ["The Stranger", "Albert Camus", "fiction", "swap", null],
    ],
  },
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

async function ensureUser(email, name) {
  const createRes = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
    }),
  });
  if (createRes.ok) {
    return (await createRes.json()).id;
  }
  // Already exists — find it.
  const listRes = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: H,
  });
  const list = await listRes.json();
  const users = list.users ?? list;
  const found = users.find((u) => u.email === email);
  if (!found) throw new Error(`Could not create or find user ${email}`);
  return found.id;
}

async function main() {
  // Load genres → slug->id map once.
  const genresRes = await fetch(`${URL}/rest/v1/genres?select=id,slug`, {
    headers: H,
  });
  const genres = await genresRes.json();
  const genreId = Object.fromEntries(genres.map((g) => [g.slug, g.id]));

  for (const seller of SELLERS) {
    console.log(`→ Ensuring seller ${seller.name}…`);
    const sellerId = await ensureUser(seller.email, seller.name);

    await fetch(`${URL}/rest/v1/profiles?id=eq.${sellerId}`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ display_name: seller.name, city: seller.city }),
    });

    // Replace this seller's own listings (idempotent).
    await fetch(`${URL}/rest/v1/listings?seller_id=eq.${sellerId}`, {
      method: "DELETE",
      headers: { ...H, Prefer: "return=minimal" },
    });

    console.log(`  fetching covers + building ${seller.books.length} books…`);
    const rows = [];
    for (const [title, author, slug, type, price] of seller.books) {
      const cover = await fetchCover(title, author);
      rows.push({
        seller_id: sellerId,
        listing_type: type,
        title,
        author,
        description: null,
        condition: ["new", "like_new", "good", "worn"][rows.length % 4],
        price: type === "sale" ? price : null,
        is_negotiable: type === "sale" && rows.length % 3 === 0,
        swap_wanted: type === "swap" ? "ნებისმიერი ქართული პროზა" : null,
        city: seller.city,
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
      console.error("  insert failed:", insertRes.status, await insertRes.text());
      process.exit(1);
    }
    const withCover = rows.filter((r) => r.cover_external_url).length;
    console.log(
      `✓ ${seller.name}: ${rows.length} listings (${withCover} with covers).`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
