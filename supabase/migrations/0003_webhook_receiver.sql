-- AutoFlow AI - Inbound webhook receiver migration.
-- Adds a unique, unguessable token per workflow so external services
-- (n8n, Telegram, etc.) can POST to a stable URL and actually trigger a run.

alter table public.workflows
  add column if not exists webhook_token uuid not null default gen_random_uuid() unique;

-- Executions created by an inbound webhook happen with no logged-in user
-- session, so they're inserted via the service-role key from the webhook
-- route (which bypasses RLS). Nothing further to add here — the existing
-- policies on workflow_executions still protect reads to the workflow's
-- owner.
