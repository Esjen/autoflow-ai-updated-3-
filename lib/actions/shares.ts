import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getOrCreateShare(workflowId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated.");

  const { data: existing, error: existingError } = await supabase
    .from("workflow_shares")
    .select("*")
    .eq("workflow_id", workflowId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to look up share:", existingError);
  }

  if (existing) return existing;

  const { data, error } = await supabase
    .from("workflow_shares")
    .insert({ workflow_id: workflowId, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("Failed to create share:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function revokeShare(workflowId: string) {
  const { error } = await supabase
    .from("workflow_shares")
    .delete()
    .eq("workflow_id", workflowId);

  if (error) {
    console.error("Failed to revoke share:", error);
    throw new Error(error.message);
  }
}

export interface SharedWorkflow {
  id: string;
  title: string;
  description: string;
  trigger: string;
  ai_model: string;
  action: string;
  status: string;
  nodes: unknown[];
  edges: unknown[];
}

/**
 * Loads a shared workflow through the server route, which looks it up by its
 * secret token and strips node secrets. The browser can no longer query the
 * workflows or workflow_shares tables directly for this.
 */
export async function getSharedWorkflow(token: string): Promise<SharedWorkflow | null> {
  try {
    const res = await fetch(`/api/share/${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SharedWorkflow;
  } catch {
    return null;
  }
}
