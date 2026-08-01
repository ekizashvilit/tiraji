-- ---------------------------------------------------------------------------
-- search_events: anonymous log of executed searches
--
-- Powers the homepage "What people are searching for" section with real data.
--
-- Privacy: only the search term, a random per-browser id and a timestamp are
-- stored — NO user id, IP or other PII. The random client_id lets the aggregate
-- count distinct browsers per term, so one person repeating a search counts
-- once (spam/skew mitigation).
--
-- The table is insert-only for the public; reads happen exclusively through the
-- popular_searches() SECURITY DEFINER function. Idempotent — safe to re-run.
-- ---------------------------------------------------------------------------

create table if not exists search_events (
  id         uuid primary key default gen_random_uuid(),
  term       text not null,
  client_id  text,
  created_at timestamptz not null default now()
);

create index if not exists search_events_created_idx
  on search_events (created_at desc);
create index if not exists search_events_term_idx
  on search_events (lower(btrim(term)));

alter table search_events enable row level security;

-- Anyone (signed in or not) may log a search; nobody may read rows directly.
drop policy if exists search_events_insert on search_events;
create policy search_events_insert on search_events
  for insert to anon, authenticated
  with check (char_length(btrim(term)) between 1 and 100);

-- Top search terms over the last p_days, ranked by distinct browsers (falling
-- back to per-row when a client_id is missing). Returns a representative
-- display casing per term via mode().
create or replace function public.popular_searches(
  p_limit integer default 10,
  p_days  integer default 30
)
returns table (term text, hits bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    mode() within group (order by btrim(e.term)) as term,
    count(distinct coalesce(e.client_id, e.id::text)) as hits
  from search_events e
  where e.created_at >= now() - make_interval(days => greatest(p_days, 1))
    and char_length(btrim(e.term)) >= 2
  group by lower(btrim(e.term))
  order by hits desc, max(e.created_at) desc
  limit greatest(p_limit, 1);
$$;
