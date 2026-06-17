-- ============================================================================
--  Project RISHI — LMS database schema (Supabase / Postgres)
--  Paste this whole file into the Supabase SQL Editor and click "Run".
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---- Tasks -----------------------------------------------------------------
create table if not exists lms_tasks (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text default '',
  tags           text[] default '{}',
  due_at         timestamptz not null,
  requires_file  boolean default false,
  assigner_email text not null,
  assignee_email text not null,
  status         text not null default 'not_complete', -- not_complete | pending | complete
  submitted_at   timestamptz,
  created_at     timestamptz not null default now()
);

-- ---- Events ----------------------------------------------------------------
create table if not exists lms_events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text default '',
  start_at      timestamptz not null,
  end_at        timestamptz,
  creator_email text not null,
  scope_kind    text not null,           -- members | group | club | all_newbies
  scope_emails  text[] default '{}',
  scope_groups  text[] default '{}',
  created_at    timestamptz not null default now()
);

create index if not exists lms_tasks_assignee_idx on lms_tasks (assignee_email);
create index if not exists lms_tasks_assigner_idx on lms_tasks (assigner_email);
create index if not exists lms_events_start_idx   on lms_events (start_at);

-- ---- Google Calendar connections -------------------------------------------
-- One row per member who connected their Google Calendar. Holds the refresh
-- token (server-only) and the set of items already pushed (for delete sync).
create table if not exists lms_gcal (
  user_email    text primary key,
  refresh_token text not null,
  sync_enabled  boolean not null default true,
  synced_keys   text[] default '{}',
  updated_at    timestamptz not null default now()
);

-- ---- Security --------------------------------------------------------------
-- Turn ON row-level security with NO policies. This blocks the public "anon"
-- key from touching these tables. The website talks to the database only from
-- the server using the SERVICE ROLE key, which bypasses RLS — so the app keeps
-- working while the data stays private.
alter table lms_tasks  enable row level security;
alter table lms_events enable row level security;
alter table lms_gcal   enable row level security;

-- ---- Grants ----------------------------------------------------------------
-- The website talks to the database only from the server, using the secret
-- (service_role) key. If "Automatically expose new tables" is OFF in your
-- project (recommended), new tables get no grants by default — so grant the
-- service_role explicitly here. We deliberately do NOT grant anon/authenticated,
-- so the public key has no access to these tables at all.
grant all privileges on table lms_tasks  to service_role;
grant all privileges on table lms_events to service_role;
grant all privileges on table lms_gcal   to service_role;
