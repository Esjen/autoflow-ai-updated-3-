import type { SupabaseClient } from "@supabase/supabase-js";

import { executeWorkflow, type ApiKeyMap } from "@/lib/engine/execute";
import type { ApiKeyProvider } from "@/lib/types/workflow";

const PROVIDER_TO_FIELD: Record<ApiKeyProvider, keyof ApiKeyMap | undefined> = {
  openai: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
  slack: undefined,
  telegram: undefined,
};

interface WorkflowGraph {
  id: string;
  trigger?: string | null;
  nodes?: unknown;
  edges?: unknown;
  user_id: string;
}

/**
 * Runs the execution engine for a workflow and persists a row to
 * `workflow_executions`. Shared by both the authenticated "Run Workflow"
 * button and the inbound webhook receiver — the only difference between
 * them is which Supabase client (and therefore which auth context) is
 * passed in, and whether an inbound payload is supplied.
 */
export async function runAndPersistExecution(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  workflow: WorkflowGraph,
  triggerLabel: string,
  inboundPayload?: unknown
) {
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  const edges = Array.isArray(workflow.edges) ? workflow.edges : [];

  const { data: keyRows } = await supabase
    .from("user_api_keys")
    .select("provider, key_value")
    .eq("user_id", workflow.user_id);

  const apiKeys: ApiKeyMap = {};
  for (const row of keyRows ?? []) {
    const field = PROVIDER_TO_FIELD[row.provider as ApiKeyProvider];
    if (field) apiKeys[field] = row.key_value;
  }

  const startedAt = new Date().toISOString();
  const startedMs = Date.now();

  const leadWriter = async (lead: Record<string, unknown>) => {
    const email = lead.email as string | null;

    if (email) {
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("user_id", workflow.user_id)
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("leads")
          .update(lead)
          .eq("id", existing.id);
        return { error: error?.message };
      }
    }

    const { error } = await supabase.from("leads").insert({
      ...lead,
      user_id: workflow.user_id,
      workflow_id: workflow.id,
    });

    return { error: error?.message };
  };

  const result = await executeWorkflow(
    nodes,
    edges,
    triggerLabel,
    apiKeys,
    inboundPayload,
    leadWriter
  );

  const finishedAt = new Date().toISOString();

  const { data: execution, error: insertError } = await supabase
    .from("workflow_executions")
    .insert({
      workflow_id: workflow.id,
      user_id: workflow.user_id,
      status: result.status,
      trigger: triggerLabel,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: Date.now() - startedMs,
      logs: result.logs,
      error: result.error ?? null,
    })
    .select()
    .single();

  return { result, execution, insertError };
}
