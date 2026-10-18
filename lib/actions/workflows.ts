import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

import type { Workflow } from "@/lib/types/workflow";

interface WorkflowRow {
  id: string;
  user_id?: string;
  created_at?: string;
  title: string;
  description: string;
  trigger: Workflow["trigger"];
  ai_model: Workflow["aiModel"];
  action: Workflow["action"];
  status: Workflow["status"];
  nodes?: unknown[];
  edges?: unknown[];
  webhook_token?: string;
}

function mapWorkflow(data: WorkflowRow): Workflow {
  return {
    id: data.id,
    user_id: data.user_id,
    created_at: data.created_at,
    title: data.title,
    description: data.description,
    trigger: data.trigger,
    aiModel: data.ai_model,
    action: data.action,
    status: data.status,
    nodes: data.nodes ?? [],
    edges: data.edges ?? [],
    webhookToken: data.webhook_token,
  };
}

export async function getWorkflows() {
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch workflows:", error);
    throw new Error(error.message);
  }

  return (data ?? []).map(mapWorkflow);
}

export async function createWorkflow(
  workflow: Omit<Workflow, "id" | "user_id" | "created_at">
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      user_id: user.id,
      title: workflow.title,
      description: workflow.description,
      trigger: workflow.trigger,
      ai_model: workflow.aiModel,
      action: workflow.action,
      status: workflow.status,
      nodes: workflow.nodes ?? [],
      edges: workflow.edges ?? [],
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create workflow:", error);
    throw new Error(error.message);
  }

  return mapWorkflow(data);
}

export async function updateWorkflow(
  id: string,
  workflow: Omit<Workflow, "id" | "user_id" | "created_at">
) {
  const { data, error } = await supabase
    .from("workflows")
    .update({
      title: workflow.title,
      description: workflow.description,
      trigger: workflow.trigger,
      ai_model: workflow.aiModel,
      action: workflow.action,
      status: workflow.status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update workflow:", error);
    throw new Error(error.message);
  }

  return mapWorkflow(data);
}

export async function deleteWorkflow(id: string) {
  const { error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete workflow:", error);
    throw new Error(error.message);
  }

  return true;
}