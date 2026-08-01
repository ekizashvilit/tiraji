-- ---------------------------------------------------------------------------
-- Typo-tolerant search: match by word_similarity, not whole-text similarity
--
-- Previously the fuzzy branch used `search_text % q`, i.e. similarity() between
-- the query and the ENTIRE search_text (title + author + description + …).
-- Because search_text is long, that score is diluted far below the threshold,
-- so a small typo (e.g. "მორე სქესი" vs "მეორე სქესი") returned nothing.
--
-- word_similarity(q, search_text) instead scores the query against the most
-- similar *portion* of the text, independent of its length — so partial and
-- mistyped queries still match. The threshold is written inline (>= 0.3) rather
-- than via the pg_trgm GUC, because managed Postgres (Supabase) doesn't allow
-- setting pg_trgm.word_similarity_threshold in a function's SET clause.
--
-- Same signatures as 0013, so this just replaces the bodies. Requires 0013.
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
    case when p_sort = 'relevance' and q is not null and q <> ''
         then word_similarity(q, l.search_text) end desc nulls last,
    l.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

create or replace function public.listing_facets(
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
  p_has_photo  boolean default null
)
returns jsonb
language sql
stable
as $$
  with b as (
    select
      l.listing_type, l.condition, l.genre_id, l.book_language, l.city,
      (p_types      is null or l.listing_type  = any(p_types))       as m_type,
      (p_conditions is null or l.condition      = any(p_conditions)) as m_cond,
      (p_genres     is null or l.genre_id       = any(p_genres))     as m_genre,
      (p_languages  is null or l.book_language  = any(p_languages))  as m_lang,
      (p_cities     is null or l.city           = any(p_cities))     as m_city,
      ((p_min_price is null or l.price >= p_min_price)
        and (p_max_price is null or l.price <= p_max_price))         as m_price,
      (p_has_photo is not true or array_length(l.cover_image_paths, 1) > 0) as m_photo
    from listings l
    where l.status = 'active'
      and case
        when 'wanted' = any(p_types) then l.listing_type = 'wanted'
        else l.listing_type <> 'wanted'
      end
      and (p_author is null or p_author = ''
           or l.author ilike '%' || p_author || '%'
           or word_similarity(p_author, coalesce(l.author, '')) >= 0.3)
      and (p_title is null or p_title = ''
           or l.title ilike '%' || p_title || '%'
           or word_similarity(p_title, l.title) >= 0.3)
      and (q is null or q = ''
           or l.search_text ilike '%' || q || '%'
           or word_similarity(q, l.search_text) >= 0.3)
  )
  select jsonb_build_object(
    'total',
      (select count(*) from b
        where m_type and m_cond and m_genre and m_lang and m_city and m_price and m_photo),
    'types',
      coalesce((select jsonb_object_agg(listing_type::text, c) from (
        select listing_type, count(*) c from b
        where m_cond and m_genre and m_lang and m_city and m_price and m_photo
        group by listing_type
      ) s), '{}'::jsonb),
    'conditions',
      coalesce((select jsonb_object_agg(condition::text, c) from (
        select condition, count(*) c from b
        where m_type and m_genre and m_lang and m_city and m_price and m_photo and condition is not null
        group by condition
      ) s), '{}'::jsonb),
    'genres',
      coalesce((select jsonb_object_agg(genre_id::text, c) from (
        select genre_id, count(*) c from b
        where m_type and m_cond and m_lang and m_city and m_price and m_photo and genre_id is not null
        group by genre_id
      ) s), '{}'::jsonb),
    'languages',
      coalesce((select jsonb_object_agg(book_language, c) from (
        select book_language, count(*) c from b
        where m_type and m_cond and m_genre and m_city and m_price and m_photo and book_language is not null
        group by book_language
      ) s), '{}'::jsonb),
    'cities',
      coalesce((select jsonb_object_agg(city, c) from (
        select city, count(*) c from b
        where m_type and m_cond and m_genre and m_lang and m_price and m_photo and city is not null
        group by city
      ) s), '{}'::jsonb)
  );
$$;
