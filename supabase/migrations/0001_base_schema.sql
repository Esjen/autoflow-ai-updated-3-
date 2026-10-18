-- AutoFlow AI - Base schema (RECONSTRUCTED).
--
-- The original first migration was created by hand in the Supabase SQL editor
-- and was never saved to the repo. This file rebuilds it from what the code
-- reads and writes, so a brand-new Supabase project can be set up from scratch.
-- If your existing project already has a `workflows` table, you do not need to
-- run this; it is written to be safe to re-run either way.
--
-- Run order for a fresh project: 0001 -> 0002 -> 0003 -> 0004 -> 0005.

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  description text not null default '',

  -- Summary fields shown on dashboard cards. The real graph lives in the
  -- `nodes` / `edges` columns added by migration 0002.
  trigger text not null default 'Webhook',
  ai_model text not null default 'GPT-5.5',
  action text not null default 'Slack',

  status text not null default 'Draft'
    check (status in ('Running', 'Draft', 'Paused')),

  created_at timestamptz not null default now()
);

create index if not exists workflows_user_id_idx
  on public.workflows (user_id, created_at desc);

alter table public.workflows enable row level security;

drop policy if exists "Users can manage their own workflows" on public.workflows;
create policy "Users can manage their own workflows"
  on public.workflows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
