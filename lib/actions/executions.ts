import { createClient } from "@/lib/supabase/client";
import type { WorkflowExecution } from "@/lib/types/workflow";

const supabase = createClient();

export async function getExecutions(
  workflowId: string,
  limit = 20
): Promise<WorkflowExecution[]> {
  const { data, error } = await supabase
    .from("workflow_executions")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch executions:", error);
    return [];
  }

  return data ?? [];
}

/** Runs the workflow server-side via the execution engine and returns the result. */
export async function runWorkflow(workflowId: string) {
  const res = await fetch(`/api/workflows/${workflowId}/execute`, {
    method: "POST",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to run workflow");
  }

  return data as {
    status: "success" | "failed";
    logs: WorkflowExecution["logs"];
    error?: string;
    execution?: WorkflowExecution;
  };
}
