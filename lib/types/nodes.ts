// Node "kind" is the specific behavior of a node (distinct from its broad
// category, which is derived from the kind via NODE_CATEGORY below).
export type NodeKind =
  // Triggers
  | "trigger_telegram"
  | "trigger_whatsapp"
  | "trigger_email"
  | "trigger_webhook"
  // AI
  | "ai"
  // Logic
  | "condition"
  | "switch"
  | "loop"
  | "delay"
  // Actions
  | "action_email"
  | "action_google_sheets"
  | "action_slack"
  | "action_discord"
  | "action_telegram"
  | "action_http"
  | "action_lead"
  // Data
  | "database";

export type NodeCategory =
  | "trigger"
  | "ai"
  | "logic"
  | "action"
  | "database";

export const NODE_CATEGORY: Record<NodeKind, NodeCategory> = {
  trigger_telegram: "trigger",
  trigger_whatsapp: "trigger",
  trigger_email: "trigger",
  trigger_webhook: "trigger",
  ai: "ai",
  condition: "logic",
  switch: "logic",
  loop: "logic",
  delay: "logic",
  action_email: "action",
  action_google_sheets: "action",
  action_slack: "action",
  action_discord: "action",
  action_telegram: "action",
  action_http: "action",
  action_lead: "action",
  database: "database",
};

// Per-kind configuration shapes. Everything is optional so partially
// configured nodes (fresh off the palette) remain valid.
export interface NodeConfigMap {
  trigger_telegram: { botToken?: string };
  trigger_whatsapp: { phoneNumberId?: string };
  trigger_email: { inboxAddress?: string };
  trigger_webhook: { path?: string };
  ai: {
    model?: "GPT-5.5" | "Gemini" | "Claude";
    prompt?: string;
    responseFormat?: "text" | "json";
    /** Plain-language description of expected fields, e.g. "score (number 1-10), reason (string)" */
    expectedFields?: string;
  };
  condition: { expression?: string };
  switch: { cases?: string[] };
  loop: { collectionPath?: string; maxIterations?: number };
  delay: { durationMs?: number };
  action_email: { to?: string; subject?: string; body?: string };
  action_google_sheets: { spreadsheetId?: string; range?: string };
  action_slack: { webhookUrl?: string; channel?: string; message?: string };
  action_discord: { webhookUrl?: string; message?: string };
  action_telegram: { chatId?: string; message?: string };
  action_http: {
    url?: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: string;
    body?: string;
  };
  action_lead: {
    name?: string;
    email?: string;
    phone?: string;
    source?: string;
    score?: string;
    status?: "new" | "qualified" | "contacted" | "won" | "lost";
    notes?: string;
  };
  database: { table?: string };
}

export type NodeConfig<K extends NodeKind = NodeKind> = NodeConfigMap[K];

export interface WorkflowNodeData {
  label: string;
  // `type` is kept for backwards compatibility with earlier saved graphs
  // (they only stored a broad category: "trigger" | "ai" | "action" | ...).
  type: NodeCategory;
  kind: NodeKind;
  config?: NodeConfig;
}

export const NODE_DEFINITIONS: {
  kind: NodeKind;
  label: string;
  category: NodeCategory;
  description: string;
}[] = [
  { kind: "trigger_telegram", label: "Telegram", category: "trigger", description: "Starts when a Telegram message is received" },
  { kind: "trigger_whatsapp", label: "WhatsApp", category: "trigger", description: "Starts when a WhatsApp message is received" },
  { kind: "trigger_email", label: "Email", category: "trigger", description: "Starts when an email arrives" },
  { kind: "trigger_webhook", label: "Webhook", category: "trigger", description: "Starts when an HTTP request hits your webhook URL" },
  { kind: "ai", label: "AI", category: "ai", description: "Send data to GPT-5.5, Gemini or Claude" },
  { kind: "condition", label: "If / Condition", category: "logic", description: "Branch true / false based on an expression" },
  { kind: "switch", label: "Switch", category: "logic", description: "Branch into multiple named cases" },
  { kind: "loop", label: "Loop", category: "logic", description: "Repeat the downstream steps for each item" },
  { kind: "delay", label: "Delay", category: "logic", description: "Pause the workflow for a fixed duration" },
  { kind: "action_email", label: "Send Email", category: "action", description: "Send an email" },
  { kind: "action_google_sheets", label: "Google Sheets", category: "action", description: "Append a row to Google Sheets" },
  { kind: "action_slack", label: "Slack", category: "action", description: "Post a message to Slack" },
  { kind: "action_discord", label: "Discord", category: "action", description: "Post a message to Discord" },
  { kind: "action_telegram", label: "Telegram", category: "action", description: "Send a Telegram message" },
  { kind: "action_http", label: "HTTP Request", category: "action", description: "Call any external API (n8n webhook, etc.)" },
  { kind: "action_lead", label: "Create/Update Lead", category: "action", description: "Save a scored lead into your Leads pipeline" },
  { kind: "database", label: "Supabase", category: "database", description: "Read or write a Supabase table" },
];

export function defaultLabelFor(kind: NodeKind): string {
  return NODE_DEFINITIONS.find((n) => n.kind === kind)?.label ?? kind;
}
