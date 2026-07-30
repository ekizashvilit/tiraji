-- ---------------------------------------------------------------------------
-- Admin dashboard statistics.
--
-- A single SECURITY DEFINER function returns aggregate counts across the whole
-- database (users, listings, activity) plus 30-day daily series for charts.
-- It runs as the definer so it can count rows RLS would otherwise hide (e.g.
-- messages), but only AFTER checking the caller is an admin — and it returns
-- counts only, never row contents, so no private data is exposed.
-- ---------------------------------------------------------------------------

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'users_total',        (select count(*) from profiles),
    'users_7d',           (select count(*) from profiles where created_at >= now() - interval '7 days'),
    'users_30d',          (select count(*) from profiles where created_at >= now() - interval '30 days'),

    'listings_total',     (select count(*) from listings),
    'listings_active',    (select count(*) from listings where status = 'active'),
    'listings_hidden',    (select count(*) from listings where status = 'hidden'),
    'listings_closed',    (select count(*) from listings where status = 'closed'),
    'listings_sale',      (select count(*) from listings where listing_type = 'sale'),
    'listings_swap',      (select count(*) from listings where listing_type = 'swap'),
    'listings_giveaway',  (select count(*) from listings where listing_type = 'giveaway'),
    'listings_today',     (select count(*) from listings where created_at >= date_trunc('day', now())),
    'listings_7d',        (select count(*) from listings where created_at >= now() - interval '7 days'),
    'listings_30d',       (select count(*) from listings where created_at >= now() - interval '30 days'),

    'conversations_total',(select count(*) from conversations),
    'messages_total',     (select count(*) from messages),
    'alerts_total',       (select count(*) from book_alerts),
    'favorites_total',    (select count(*) from favorites),
    'reports_total',      (select count(*) from reports),

    'listings_daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb)
      from (
        select date_trunc('day', created_at)::date as d, count(*) as c
        from listings
        where created_at >= now() - interval '30 days'
        group by 1
      ) t
    ),
    'users_daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb)
      from (
        select date_trunc('day', created_at)::date as d, count(*) as c
        from profiles
        where created_at >= now() - interval '30 days'
        group by 1
      ) t
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;
