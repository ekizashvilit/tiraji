// Phone-as-identity helpers (client-safe — no server imports).
//
// We support signing up with a Georgian mobile number and a password without
// SMS verification. The number is normalized to a canonical form and mapped to
// a synthetic, non-deliverable email so Supabase's email+password auth can back
// it. No mail is ever sent to this address (email confirmation is disabled).

const PHONE_EMAIL_DOMAIN = "phone.tiraji.local";

// Accepts "599123456", "0599123456", "+995 599 12 34 56", "995599123456"…
// Returns canonical "995XXXXXXXXX" (country code + 9 digits) or null if invalid.
export function normalizeGeorgianPhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("995")) {
    // already has the country code
  } else if (d.startsWith("0")) {
    d = "995" + d.slice(1);
  } else if (d.length === 9) {
    d = "995" + d;
  }
  // Georgian mobile numbers: country code 995 + 9 digits starting with 5.
  if (!/^995[5]\d{8}$/.test(d)) return null;
  return d;
}

export function phoneToEmail(canonical: string): string {
  return `${canonical}@${PHONE_EMAIL_DOMAIN}`;
}

// Pretty display, e.g. "995599123456" → "+995 599 12 34 56".
export function formatGeorgianPhone(canonical: string): string {
  const m = /^995(\d{3})(\d{2})(\d{2})(\d{2})$/.exec(canonical);
  if (!m) return canonical;
  return `+995 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
}
