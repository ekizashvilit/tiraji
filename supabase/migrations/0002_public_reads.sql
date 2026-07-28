-- Tiraji — public read access for lookup/public data.
-- Needed because this project enables RLS by default on new tables.

-- genres: public lookup, readable by everyone.
alter table genres enable row level security;
drop policy if exists genres_select on genres;
create policy genres_select on genres
  for select using (true);

-- public_seller view: privacy-safe seller info (phone hidden unless show_phone).
-- Views aren't RLS-controlled, so grant read access explicitly.
grant select on public_seller to anon, authenticated;
