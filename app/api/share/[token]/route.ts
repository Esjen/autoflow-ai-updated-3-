import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: Promise<{ token: string }>;
}

// Share tokens are 32 hex characters (see workflow_shares.token).
const TOKEN_PATTERN = /^[A-Za-z0-9]{16,64}$/;

/**
 * A shared page only needs the *shape* of a workflow. Node configuration can
 * contain secrets (Telegram bot tokens, Slack/Discord webhook URLs, HTTP
 * headers), so every node's config is dropped, except the `cases` list a
 * Switch node needs to draw its outputs.
 */
function toPublicNode(node: unknown): unknown {
  if (!node || typeof node !== "object") return node;

  const original = node as { data?: Record<string, unknown> } & Record<string, unknown>;
  const data = { ...(original.data ?? {}) } as Record<string, unknown>;
  const config = data.config as { cases?: unknown } | undefined;

  data.config = Array.isArray(config?.cases) ? { cases: config.cases } : {};

  return { ...original, data };
}

/**
 * Public, read-only view of a shared workflow.
 *
 * The database no longer lets anonymous visitors read the `workflows` or
 * `workflow_shares` tables (see migration 0005). This route looks up one
 * workflow by its secret token with the service-role key and returns only
 * the fields a shared page needs. It never returns user_id or webhook_token.
 */
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;

  const notFound = () =>
    NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!TOKEN_PATTERN.test(token)) return notFound();

  const supabase = createAdminClient();

  const { data: share } = await supabase
    .from("workflow_shares")
    .select("workflow_id")
    .eq("token", token)
    .maybeSingle();

  if (!share) return notFound();

  const { data: workflow } = await supabase
    .from("workflows")
    .select("id, title, description, trigger, ai_model, action, status, nodes, edges")
    .eq("id", share.workflow_id)
    .maybeSingle();

  if (!workflow) return notFound();

  return NextResponse.json(
    {
      ...workflow,
      nodes: Array.isArray(workflow.nodes) ? workflow.nodes.map(toPublicNode) : [],
      edges: Array.isArray(workflow.edges) ? workflow.edges : [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
