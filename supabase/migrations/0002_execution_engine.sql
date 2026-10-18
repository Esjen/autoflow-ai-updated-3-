-- AutoFlow AI - Execution Engine & Pending Features migration
-- Run this in the Supabase SQL editor (or `supabase db push`) after the
-- initial schema that created the `workflows` table.

-- 1. Make sure the visual builder graph columns exist on `workflows`.
alter table public.workflows
  add column if not exists nodes jsonb not null default '[]'::jsonb,
  add column if not exists edges jsonb not null default '[]'::jsonb;

-- 2. Execution history (replaces the hard-coded fake execution logs).
create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('success', 'failed', 'running')),
  trigger text not null default 'Manual',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  logs jsonb not null default '[]'::jsonb,
  error text
);

create index if not exists workflow_executions_workflow_id_idx
  on public.workflow_executions (workflow_id, started_at desc);

alter table public.workflow_executions enable row level security;

create policy "Users can view their own executions"
  on public.workflow_executions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own executions"
  on public.workflow_executions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own executions"
  on public.workflow_executions for update
  using (auth.uid() = user_id);

-- 3. Version history — a snapshot of the graph every time it's saved.
create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists workflow_versions_workflow_id_idx
  on public.workflow_versions (workflow_id, created_at desc);

alter table public.workflow_versions enable row level security;

create policy "Users can view their own versions"
  on public.workflow_versions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own versions"
  on public.workflow_versions for insert
  with check (auth.uid() = user_id);

-- 4. Per-user API keys (OpenAI / Claude / Gemini / Slack / Telegram).
create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (
    provider in ('openai', 'anthropic', 'gemini', 'slack', 'telegram')
  ),
  key_value text not null,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.user_api_keys enable row level security;

create policy "Users can manage their own api keys"
  on public.user_api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Shareable read-only links.
create table if not exists public.workflow_shares (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

alter table public.workflow_shares enable row level security;

create policy "Users can manage their own shares"
  on public.workflow_shares for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public (anon) read access is required so that /share/[token] pages can be
-- viewed by people who are not signed in. We only expose the workflow graph,
-- never the owner's other data.
create policy "Anyone can read a share row by token"
  on public.workflow_shares for select
  using (true);

create policy "Anyone can read a shared workflow"
  on public.workflows for select
  using (
    exists (
      select 1 from public.workflow_shares s
      where s.workflow_id = workflows.id
    )
  );
