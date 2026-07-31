# Unread-message email reminders — setup

Emails a user once when a message they received has been **unread for 2 hours**.
One email per run, one reminder per message (never twice). Free tier: Brevo
(300 emails/day) + Supabase pg_cron + Edge Functions.

Do these **once**. Steps 1–2 are on websites; 3–6 are terminal/SQL.

---

## 1. Brevo account (the email sender) — free

1. Sign up at <https://www.brevo.com> (free plan = 300 emails/day).
2. **Senders, Domains & IPs → Domains → Add a domain.** Add `tiraji.ge` and add
   the DKIM/DMARC/branding DNS records Brevo gives you to Cloudflare (all CNAMEs
   set to "DNS only" / grey cloud). Once it shows **Authenticated**, you can send
   from any `@tiraji.ge` address — `FROM_EMAIL` is `noreply@tiraji.ge`.
3. **SMTP & API → API keys & MCP → Generate a new API key.** Copy it — that's
   `BREVO_API_KEY`. (Note: an API key also expires after 90 days of inactivity,
   so if the feature stays dormant, regenerate the key when you finally deploy.)

> The domain is already authenticated (done during initial email setup).
> Incoming `@tiraji.ge` mail is forwarded to Gmail via Cloudflare Email Routing;
> that's separate from sending and needs no changes here.

## 2. Pick a cron secret

Any random string — it just stops strangers from triggering the function.
For example run `openssl rand -hex 16` and keep the output as `CRON_SECRET`.

## 3. Apply the migration

Run `supabase/migrations/0005_unread_email.sql` (via `supabase db push` or paste
it into the dashboard SQL editor). It adds `messages.notified_at` and enables
`pg_cron` + `pg_net`.

## 4. Set the function's secrets

```bash
supabase secrets set \
  BREVO_API_KEY="your-brevo-key" \
  CRON_SECRET="your-random-secret" \
  FROM_EMAIL="noreply@tiraji.ge" \
  FROM_NAME="ტირაჟი / Tiraji" \
  SITE_URL="https://tiraji.ge"
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically — do
not set them.)

## 5. Deploy the function

```bash
supabase functions deploy notify-unread --no-verify-jwt
```

`--no-verify-jwt` lets the scheduler call it; the `CRON_SECRET` header is what
actually protects it.

## 6. Schedule it (runs every 15 min)

Paste this into the dashboard **SQL editor**, replacing the two placeholders.
It contains your secret, so keep it out of git.

```sql
select cron.schedule(
  'notify-unread',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/notify-unread',
    headers := jsonb_build_object(
      'content-type',  'application/json',
      'x-cron-secret', '<YOUR_CRON_SECRET>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

- `<YOUR_PROJECT_REF>` — the subdomain in your Supabase URL.
- `<YOUR_CRON_SECRET>` — the same value from step 2.

To change or remove it later: `select cron.unschedule('notify-unread');`

---

## Test it

```bash
curl -X POST 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/notify-unread' \
  -H 'x-cron-secret: <YOUR_CRON_SECRET>'
```

Expected: `{"processed":N,"emailed":M}`. To force an email, send yourself a
message from a second account, then in SQL make it look old:

```sql
update messages set created_at = now() - interval '3 hours'
where read_at is null;
```

Run the curl again — the recipient (if they signed up with an email) gets one.

## Good to know

- **Only email accounts get reminders.** Phone-only users have no email, so
  they're skipped (they still see the in-app unread badge).
- **Sleep:** a Supabase free project pauses after ~7 days idle, which also
  pauses pg_cron. Your keep-alive ping prevents that.
- **Volume:** capped at 50 emails per run in code; well under Brevo's 300/day.
