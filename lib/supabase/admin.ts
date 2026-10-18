import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Uses the Supabase SERVICE ROLE key, which bypasses Row Level Security.
 *
 * Only ever import this inside server-only code (API routes) that has
 * already independently verified the request is allowed to act — e.g. the
 * inbound webhook receiver, which authenticates via an unguessable
 * per-workflow token instead of a user session.
 *
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser bundle. It must be
 * set as a plain (non `NEXT_PUBLIC_`) environment variable.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (find it in Supabase → Project Settings → API)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
