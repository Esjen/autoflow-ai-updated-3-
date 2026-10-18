import { createClient } from "@/lib/supabase/client";
import type { WorkflowVersion } from "@/lib/types/workflow";

const supabase = createClient();

export async function saveVersion(
  workflowId: string,
  nodes: unknown[],
  edges: unknown[],
  label?: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated.");

  const { error } = await supabase.from("workflow_versions").insert({
    workflow_id: workflowId,
    user_id: user.id,
    nodes,
    edges,
    label: label ?? null,
  });

  if (error) {
    console.error("Failed to save version:", error);
  }
}

export async function getVersions(workflowId: string): Promise<WorkflowVersion[]> {
  const { data, error } = await supabase
    .from("workflow_versions")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    console.error("Failed to fetch versions:", error);
    return [];
  }

  return data ?? [];
}
