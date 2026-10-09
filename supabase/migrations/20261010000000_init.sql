-- French Daily: first database schema (ROADMAP A3).
-- How to apply (one time): Supabase dashboard → SQL Editor → New query →
-- paste this whole file → Run. Safe to run once on an empty project.
--
-- Design (see DECISIONS.md 2026-10-10): each learner's progress is one JSON
-- document (learner_state). Things that only grow (sentences, AI calls,
-- events, reports) are separate tables.
--
-- Security: row level security (RLS) is on for every table. A signed-in user
-- can only read and write their own rows. The app's server uses the user's
-- session for this; only the /stats page uses the service role key.

create table if not exists public.learner_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.sentences (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  local_date date not null,
  word_id text not null,
  item_type text not null check (item_type in ('statement', 'question')),
  template_id text not null,
  original text not null,
  feedback jsonb not null
);
create index if not exists sentences_user_created on public.sentences (user_id, created_at desc);

create table if not exists public.reports (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  sentence_id uuid references public.sentences (id) on delete set null,
  note text not null default '',
  context jsonb not null default '{}'::jsonb,
  status text not null default 'new'
);

create table if not exists public.ai_calls (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  purpose text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  latency_ms integer not null default 0,
  ok boolean not null default true,
  error text
);
create index if not exists ai_calls_created on public.ai_calls (created_at);

create table if not exists public.events (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  local_date date not null,
  type text not null,
  meta jsonb not null default '{}'::jsonb
);
create index if not exists events_created on public.events (created_at);

-- Row level security ---------------------------------------------------------
alter table public.learner_state enable row level security;
alter table public.sentences enable row level security;
alter table public.reports enable row level security;
alter table public.ai_calls enable row level security;
alter table public.events enable row level security;

create policy "learner_state: read own" on public.learner_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "learner_state: insert own" on public.learner_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "learner_state: update own" on public.learner_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "sentences: read own" on public.sentences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "sentences: insert own" on public.sentences
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "reports: read own" on public.reports
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reports: insert own" on public.reports
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "ai_calls: read own" on public.ai_calls
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_calls: insert own" on public.ai_calls
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "events: read own" on public.events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "events: insert own" on public.events
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Table access ---------------------------------------------------------------
-- "Automatically expose new tables" is off in this project, so grant access
-- explicitly. Anonymous visitors get nothing.
grant select, insert, update on public.learner_state to authenticated;
grant select, insert on public.sentences, public.reports, public.ai_calls, public.events to authenticated;
grant all on public.learner_state, public.sentences, public.reports, public.ai_calls, public.events to service_role;
