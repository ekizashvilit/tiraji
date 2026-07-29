-- ---------------------------------------------------------------------------
-- Unread-message email reminders.
--
-- When a message stays unread for a couple of hours we email the recipient
-- once. `notified_at` records that an email has been sent so we never send
-- twice for the same message. The actual sending is done by the
-- `notify-unread` Edge Function, scheduled by pg_cron (see the function's
-- SETUP.md for the one-time schedule step, which needs project-specific
-- secrets and so is kept out of this migration).
--
-- Guarded so re-running is safe.
-- ---------------------------------------------------------------------------

alter table messages
  add column if not exists notified_at timestamptz;

-- Keeps the reminder scan cheap: only rows still waiting to be notified.
create index if not exists messages_unnotified
  on messages (created_at)
  where read_at is null and notified_at is null;

-- Scheduling (pg_cron) + outbound HTTP to the Edge Function (pg_net).
-- On Supabase these can also be toggled under Database → Extensions.
create extension if not exists pg_cron;
create extension if not exists pg_net;
