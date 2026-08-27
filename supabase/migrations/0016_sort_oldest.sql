-- ---------------------------------------------------------------------------
-- Add an "oldest" sort option to search_listings
--
-- The browse/search sort already offers Newest (created_at desc, the default
-- tail of the ORDER BY) and the two price directions. This adds its date-sort
-- complement: p_sort = 'oldest' orders by created_at ascending, so buyers can
-- surface long-standing listings that keep getting buried under newer ones.
--
-- Same signature as 0015 — this just replaces the body. Requires 0015.
-- Idempotent — safe to re-run.
-- ---------------------------------------------------------------------------

create or replace function public.search_listings(
  q            text default null,
  p_author     text default null,
  p_title      text default null,
  p_types      listing_type[] default null,
  p_conditions book_condition[] default null,
  p_languages  text[] default null,
  p_cities     text[] default null,
  p_genres     integer[] default null,
  p_min_price  numeric default null,
  p_max_price  numeric default null,
  p_has_photo  boolean default null,
  p_sort       text default 'recent',
  p_limit      integer default 24,
  p_offset     integer default 0
)
returns setof listings
language sql
stable
as $$
  select l.*
  from listings l
  where l.status = 'active'
    and case
      when 'wanted' = any(p_types) then l.listing_type = 'wanted'
      else l.listing_type <> 'wanted'
    end
    and (p_types      is null or l.listing_type  = any(p_types))
    and (p_cities     is null or l.city          = any(p_cities))
    and (p_conditions is null or l.condition      = any(p_conditions))
    and (p_languages  is null or l.book_language  = any(p_languages))
    and (p_genres     is null or l.genre_id       = any(p_genres))
    and (p_min_price  is null or l.price >= p_min_price)
    and (p_max_price  is null or l.price <= p_max_price)
    and (p_has_photo is not true or array_length(l.cover_image_paths, 1) > 0)
    and (p_author is null or p_author = ''
         or l.author ilike '%' || p_author || '%'
         or word_similarity(p_author, coalesce(l.author, '')) >= 0.3)
    and (p_title is null or p_title = ''
         or l.title ilike '%' || p_title || '%'
         or word_similarity(p_title, l.title) >= 0.3)
    and (
      q is null or q = ''
      or l.search_text ilike '%' || q || '%'
      or word_similarity(q, l.search_text) >= 0.3
    )
  order by
    case when p_sort = 'price_asc'  then l.price end asc  nulls last,
    case when p_sort = 'price_desc' then l.price end desc nulls last,
    case when p_sort = 'oldest'     then l.created_at end asc,
    case when p_sort = 'relevance' and q is not null and q <> ''
         then word_similarity(q, l.search_text) end desc nulls last,
    l.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;
