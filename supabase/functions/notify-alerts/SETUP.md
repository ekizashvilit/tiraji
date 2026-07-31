# Book-alert match emails — setup

Emails a user **once** when a book they subscribed to (via "Email me when this
is listed") gets posted. One email per matching listing, per subscriber, ever.
Reuses the **exact same** Brevo + cron secrets as `notify-unread` — there is
nothing new to configure, only three deploy steps.

## 1. Apply the migration

Run `supabase/migrations/0008_book_alerts.sql` (via `supabase db push` or paste
it into the dashboard **SQL editor**). It adds `listings.alerts_notified_at` and
the `match_book_alerts()` matching function. Idempotent — safe to re-run.

## 2. Deploy the function

```bash
supabase functions deploy notify-alerts --no-verify-jwt
```

The secrets it reads (`BREVO_API_KEY`, `CRON_SECRET`, `FROM_EMAIL`, `FROM_NAME`,
`SITE_URL`) are already set from the `notify-unread` setup — Edge Function
secrets are shared across all functions in the project.

## 3. Schedule it (runs every 15 min)

Paste into the dashboard **SQL editor**, replacing the two placeholders with the
same project ref and cron secret you used for `notify-unread`:

```sql
select cron.schedule(
  'notify-alerts',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/notify-alerts',
    headers := jsonb_build_object(
      'content-type',  'application/json',
      'x-cron-secret', '<YOUR_CRON_SECRET>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

To change or remove later: `select cron.unschedule('notify-alerts');`

---

## Test it

```bash
curl -X POST 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/notify-alerts' \
  -H 'x-cron-secret: <YOUR_CRON_SECRET>'
```

Expected: `{"processed":N,"emailed":M}` — `processed` = listings scanned this
run, `emailed` = subscribers notified.

To force a match end-to-end:
1. As user A, subscribe to a title on the site (search a made-up title → "Email
   me when it's listed"), using an account that has a **real email**.
2. As user B, post a listing whose title matches.
3. Run the curl. User A should receive one email; the listing is now stamped
   `alerts_notified_at` and won't email again.

## Good to know

- **Only email accounts get alerts.** Phone-only users have no email and are
  skipped (the listing is still marked scanned).
- **Forward-looking.** A listing is scanned once, right after posting. An alert
  created *after* a book already exists won't retroactively match it — it fires
  on the next matching book, as intended.
- **Matching** is ISBN-exact, or fuzzy title/author via `pg_trgm` (title ≥ 0.45,
  author ≥ 0.40). Tune the thresholds in `0008_book_alerts.sql` if needed.
- **Volume** capped at 50 emails / 200 scanned listings per run; well under
  Brevo's 300/day.
