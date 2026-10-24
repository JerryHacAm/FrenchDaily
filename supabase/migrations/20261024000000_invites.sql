-- French Daily: invite list in the database (2026-10-24).
-- How to apply (one time): Supabase dashboard → SQL Editor → New query →
-- paste this whole file → Run. Safe to run more than once.
--
-- Add a friend: Table Editor → invites → Insert row → type their email → Save.
-- No Vercel change and no redeploy needed. Capitals and spaces are ignored.
-- Remove a friend: delete their row (and their email from ALLOWED_EMAILS in
-- Vercel, if it is there too).
--
-- The app allows an email that is in this table OR in ALLOWED_EMAILS.
--
-- Security: only the app's server (service role key) can read this table.
-- RLS is on with no policies, so signed-in users and visitors can't see who
-- is invited.

create table if not exists public.invites (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

grant all on public.invites to service_role;
