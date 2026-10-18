-- AutoFlow AI - Leads layer migration.
-- Turns the generic workflow engine into an actual lead-qualification
-- product: a real place for AI-scored leads to land, instead of just
-- disappearing into execution logs.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workflow_id uuid references public.workflows(id) on delete set null,

  name text,
  email text,
  phone text,
  source text,

  score numeric,
  status text not null default 'new' check (
    status in ('new', 'qualified', 'contacted', 'won', 'lost')
  ),

  notes text,
  raw_payload jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_user_id_idx on public.leads (user_id, created_at desc);
create index if not exists leads_workflow_id_idx on public.leads (workflow_id);

alter table public.leads enable row level security;

create policy "Users can manage their own leads"
  on public.leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at current on every edit.
create or replace function public.set_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_leads_updated_at();
