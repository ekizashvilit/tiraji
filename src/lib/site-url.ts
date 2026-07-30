// The canonical base URL for auth redirects. Prefers NEXT_PUBLIC_SITE_URL so
// redirects always land on the configured host — important because the dev
// server binds to 0.0.0.0, and `window.location.origin` / a request's host can
// otherwise resolve to "http://0.0.0.0:3000" (a different cookie origin than
// localhost, which silently logs you out). Falls back to the runtime origin.
export function getSiteURL(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const base =
    fromEnv && fromEnv.length > 0
      ? fromEnv
      : typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
  return base.replace(/\/+$/, "");
}
