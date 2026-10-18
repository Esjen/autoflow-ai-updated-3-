export type WorkflowStatus =
  | "Running"
  | "Draft"
  | "Paused";

export type TriggerType =
  | "Telegram"
  | "WhatsApp"
  | "Email"
  | "Webhook";

export type AIModel =
  | "GPT-5.5"
  | "Gemini"
  | "Claude";

export type WorkflowAction =
  | "Send Email"
  | "Google Sheets"
  | "Slack"
  | "Discord";

export interface Workflow {
  id: string;

  user_id?: string;

  created_at?: string;

  title: string;

  description: string;

  trigger: TriggerType;

  aiModel: AIModel;

  action: WorkflowAction;

  status: WorkflowStatus;

  // Visual builder graph, persisted as JSON columns on the `workflows` row.
  nodes?: unknown[];
  edges?: unknown[];

  // Unguessable token used to build this workflow's inbound webhook URL
  // (see /api/webhooks/[token]).
  webhookToken?: string;
}

export type ExecutionStatus = "success" | "failed" | "running";

export interface ExecutionLogEntry {
  timestamp: string;
  nodeId?: string;
  label: string;
  message: string;
  level: "info" | "success" | "error";
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id?: string;
  status: ExecutionStatus;
  started_at: string;
  finished_at?: string | null;
  duration_ms?: number | null;
  trigger: string;
  logs: ExecutionLogEntry[];
  error?: string | null;
}

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  nodes: unknown[];
  edges: unknown[];
  created_at: string;
  label?: string | null;
}

export type ApiKeyProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "slack"
  | "telegram";

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: ApiKeyProvider;
  key_value: string;
  created_at?: string;
}

export interface WorkflowShare {
  id: string;
  workflow_id: string;
  token: string;
  created_at: string;
}