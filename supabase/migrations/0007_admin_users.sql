-- Admin user management: a `banned` flag, ban enforcement in RLS, and an
-- admin-gated RPC that lists every user (with email + listing count).

-- 1. Ban flag on profiles. Defaults false; set true when an admin suspends.
alter table profiles
  add column if not exists banned boolean not null default false;

-- 2. Helper mirroring public.is_admin(): is the *current* user banned?
--    SECURITY DEFINER so it reads the row regardless of the caller's RLS view.
create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select banned from profiles where id = auth.uid()), false);
$$;

-- 3. Block banned users from creating content. This is defense-in-depth for a
--    still-live session; the auth-level ban already blocks new logins/refreshes.
drop policy if exists listings_insert on listings;
create policy listings_insert on listings
  for insert with check (seller_id = auth.uid() and not public.is_banned());

drop policy if exists conversations_insert on conversations;
create policy conversations_insert on conversations
  for insert with check (buyer_id = auth.uid() and not public.is_banned());

drop policy if exists messages_insert on messages;
create policy messages_insert on messages
  for insert with check (
    sender_id = auth.uid()
    and not public.is_banned()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- 4. The user list for the admin panel. SECURITY DEFINER + an is_admin() gate
--    lets it read auth.users (for email) and every profile — data RLS hides.
--    auth.uid() still reflects the *caller*, so the gate is honest.
create or replace function public.admin_list_users(
  p_search text default null,
  p_limit  int  default 30,
  p_offset int  default 0
)
returns table (
  id            uuid,
  display_name  text,
  city          text,
  phone         text,
  email         text,
  is_admin      boolean,
  banned        boolean,
  created_at    timestamptz,
  listing_count bigint,
  total_count   bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select p.id, p.display_name, p.city, p.phone, p.is_admin, p.banned,
           p.created_at, u.email::text as email
    from profiles p
    join auth.users u on u.id = p.id
    where public.is_admin()                          -- non-admins get nothing
      and (
        p_search is null
        or p.display_name ilike '%' || p_search || '%'
        or u.email       ilike '%' || p_search || '%'
        or p.phone       ilike '%' || p_search || '%'
      )
  )
  select f.id, f.display_name, f.city, f.phone, f.email, f.is_admin, f.banned,
         f.created_at,
         (select count(*) from listings l where l.seller_id = f.id) as listing_count,
         count(*) over() as total_count
  from filtered f
  order by f.created_at desc
  limit  greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.admin_list_users(text, int, int) to authenticated;
