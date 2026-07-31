-- ---------------------------------------------------------------------------
-- Book alerts — "email me when this book is listed"
--
-- The `book_alerts` table + RLS already exist (0001_init). This adds the
-- machinery that turns a new listing into a match email:
--   * listings.alerts_notified_at  — marks a listing as already scanned for
--     alert matches, so the scheduled function never re-scans (and never emails
--     twice) for the same listing.
--   * match_book_alerts(ids)        — given a batch of listing ids, returns the
--     active alerts they match (ISBN exact, or fuzzy title/author via pg_trgm,
--     the same trigram search the site already uses). Called by the
--     `notify-alerts` Edge Function with the service role.
--
-- Alerts are forward-looking: a listing is scanned once, shortly after it is
-- posted. An alert created after a listing exists will not match that older
-- listing — it fires on the next matching book, which is the intended
-- "notify me when someone adds this" behaviour.
--
-- Idempotent — safe to run more than once (dashboard SQL editor or db push).
-- ---------------------------------------------------------------------------

alter table listings
  add column if not exists alerts_notified_at timestamptz;

-- Partial index over exactly the rows the scanner looks at: active listings
-- that have not been scanned for alerts yet.
create index if not exists listings_unalerted
  on listings (created_at)
  where alerts_notified_at is null and status = 'active';

-- Matching thresholds. Trigram similarity is 0..1; higher = stricter. Kept
-- fairly strict so subscribers only get emailed on genuine matches, not noise.
--   title  >= 0.45   e.g. "Crime & Punishment" vs "Crime and Punishment"
--   author >= 0.40   surname/initials variations
create or replace function public.match_book_alerts(p_listing_ids uuid[])
returns table (
  alert_id       uuid,
  user_id        uuid,
  listing_id     uuid,
  listing_title  text,
  listing_author text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a.id, a.user_id, l.id, l.title, l.author
  from listings l
  join book_alerts a
    on a.active
   -- never notify someone about their own listing
   and a.user_id <> l.seller_id
   and (
        -- strongest: exact ISBN match
        (
          coalesce(a.isbn, '') <> ''
          and coalesce(l.isbn, '') <> ''
          and lower(trim(a.isbn)) = lower(trim(l.isbn))
        )
        or
        -- fuzzy title/author match (only when the alert has no ISBN).
        -- every text criterion the alert specified must clear its threshold.
        (
          coalesce(a.isbn, '') = ''
          and (coalesce(a.title, '')  = '' or similarity(l.title, a.title) >= 0.45)
          and (coalesce(a.author, '') = '' or similarity(coalesce(l.author, ''), a.author) >= 0.40)
        )
      )
  where l.id = any (p_listing_ids)
    and l.status = 'active';
$$;

-- Only the service role (the Edge Function) may run this — it exposes which
-- users have alerts, so keep it away from anon/authenticated callers.
revoke all on function public.match_book_alerts(uuid[]) from public;
grant execute on function public.match_book_alerts(uuid[]) to service_role;
