-- ---------------------------------------------------------------------------
-- In-app messaging: enable Supabase Realtime on the messages table so a chat
-- thread receives new messages live. RLS still governs who can read each row
-- (only the two conversation parties), so realtime only streams messages the
-- subscriber is allowed to see.
--
-- Guarded so re-running is safe.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
