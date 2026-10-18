-- AutoFlow AI - Lock down shared-workflow access.
--
-- Migration 0002 created two policies that let ANYONE (including signed-out
-- visitors using the public anon key) read data:
--
--   * "Anyone can read a share row by token"  on workflow_shares  using (true)
--       -> anyone could list every share token in the database.
--   * "Anyone can read a shared workflow"     on workflows
--       -> anyone could read every shared workflow row in full, including its
--          webhook_token (which lets them trigger runs) and node configuration
--          (which can hold Telegram bot tokens and Slack/Discord webhook URLs).
--
-- Both are removed. Public share pages are now served by the server route
-- /api/share/[token], which looks up ONE workflow by its secret token using
-- the service-role key and returns only the non-sensitive fields.
--
-- Owners keep full access through the existing owner-only policies
-- ("Users can manage their own shares" and the workflows owner policy).

drop policy if exists "Anyone can read a share row by token" on public.workflow_shares;
drop policy if exists "Anyone can read a shared workflow" on public.workflows;

-- Make the API pick up the change immediately.
notify pgrst, 'reload schema';
