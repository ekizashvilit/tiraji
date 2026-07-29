-- ---------------------------------------------------------------------------
-- Phone-or-email password signup (no SMS — the phone is the account identity).
-- Extend the new-user trigger to copy a phone number (passed in user metadata
-- as `phone_number`) into the profile, and use it as the default display name.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_phone text := nullif(new.raw_user_meta_data ->> 'phone_number', '');
begin
  insert into public.profiles (id, display_name, phone)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      meta_phone,
      split_part(new.email, '@', 1)
    ),
    meta_phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
