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

export async function getSharedWorkflow(token: string) {
  const { data: share, error: shareError } = await supabase
    .from("workflow_shares")
    .select("workflow_id")
    .eq("token", token)
    .maybeSingle();

  if (shareError || !share) return null;

  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .select("id, title, description, trigger, ai_model, action, status, nodes, edges")
    .eq("id", share.workflow_id)
    .maybeSingle();

  if (workflowError || !workflow) return null;

  return workflow;
}
