import type { Node, Edge } from "@xyflow/react";
import type { TriggerType, AIModel, WorkflowAction } from "@/lib/types/workflow";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger: TriggerType;
  aiModel: AIModel;
  action: WorkflowAction;
  nodes: Node[];
  edges: Edge[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "lead-qualification",
    name: "AI Lead Qualification",
    description: "Score inbound Telegram leads with AI, save them to your Leads pipeline, then notify Slack.",
    trigger: "Telegram",
    aiModel: "GPT-5.5",
    action: "Slack",
    nodes: [
      { id: "t1", type: "workflowNode", position: { x: 50, y: 160 }, data: { label: "Telegram", type: "trigger", kind: "trigger_telegram" } },
      { id: "a1", type: "workflowNode", position: { x: 370, y: 160 }, data: { label: "GPT-5.5", type: "ai", kind: "ai", config: { model: "GPT-5.5", prompt: "Score this lead from 1-10 based on urgency and budget, and give a one-sentence reason.", responseFormat: "json", expectedFields: "score (number 1-10), reason (string)" } } },
      { id: "lead1", type: "workflowNode", position: { x: 690, y: 160 }, data: { label: "Create/Update Lead", type: "action", kind: "action_lead", config: { name: "{{payload.name}}", email: "{{payload.email}}", phone: "{{payload.phone}}", source: "Telegram", score: "{{aiJson.score}}", notes: "{{aiJson.reason}}", status: "new" } } },
      { id: "c1", type: "workflowNode", position: { x: 1010, y: 160 }, data: { label: "If / Condition", type: "logic", kind: "condition", config: { expression: "Number(data.aiJson?.score) >= 7" } } },
      { id: "s1", type: "workflowNode", position: { x: 1330, y: 60 }, data: { label: "Slack", type: "action", kind: "action_slack", config: { message: "🔥 Hot lead qualified!" } } },
      { id: "s2", type: "workflowNode", position: { x: 1330, y: 260 }, data: { label: "Google Sheets", type: "action", kind: "action_google_sheets", config: { range: "Sheet1!A:D" } } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1", animated: true, type: "smoothstep" },
      { id: "e2", source: "a1", target: "lead1", animated: true, type: "smoothstep" },
      { id: "e3", source: "lead1", target: "c1", animated: true, type: "smoothstep" },
      { id: "e4", source: "c1", sourceHandle: "true", target: "s1", animated: true, type: "smoothstep" },
      { id: "e5", source: "c1", sourceHandle: "false", target: "s2", animated: true, type: "smoothstep" },
    ],
  },
  {
    id: "support-triage",
    name: "Support Email Triage",
    description: "Classify incoming support emails and route with a switch.",
    trigger: "Email",
    aiModel: "Claude",
    action: "Send Email",
    nodes: [
      { id: "t1", type: "workflowNode", position: { x: 50, y: 140 }, data: { label: "Email", type: "trigger", kind: "trigger_email" } },
      { id: "a1", type: "workflowNode", position: { x: 370, y: 140 }, data: { label: "Claude", type: "ai", kind: "ai", config: { model: "Claude", prompt: "Classify this support email as urgent, normal or low." } } },
      { id: "sw1", type: "workflowNode", position: { x: 690, y: 140 }, data: { label: "Switch", type: "logic", kind: "switch", config: { cases: ["urgent", "normal", "low"] } } },
      { id: "e1n", type: "workflowNode", position: { x: 1010, y: 20 }, data: { label: "Send Email", type: "action", kind: "action_email", config: { subject: "Urgent: we're on it" } } },
      { id: "e2n", type: "workflowNode", position: { x: 1010, y: 160 }, data: { label: "Send Email", type: "action", kind: "action_email", config: { subject: "We received your message" } } },
      { id: "e3n", type: "workflowNode", position: { x: 1010, y: 300 }, data: { label: "Send Email", type: "action", kind: "action_email", config: { subject: "Thanks for reaching out" } } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1", animated: true, type: "smoothstep" },
      { id: "e2", source: "a1", target: "sw1", animated: true, type: "smoothstep" },
      { id: "e3", source: "sw1", sourceHandle: "urgent", target: "e1n", animated: true, type: "smoothstep" },
      { id: "e4", source: "sw1", sourceHandle: "normal", target: "e2n", animated: true, type: "smoothstep" },
      { id: "e5", source: "sw1", sourceHandle: "low", target: "e3n", animated: true, type: "smoothstep" },
    ],
  },
  {
    id: "webhook-to-n8n",
    name: "Webhook → n8n Relay",
    description: "Forward an incoming webhook to an n8n workflow after a short delay.",
    trigger: "Webhook",
    aiModel: "Gemini",
    action: "Discord",
    nodes: [
      { id: "t1", type: "workflowNode", position: { x: 50, y: 140 }, data: { label: "Webhook", type: "trigger", kind: "trigger_webhook" } },
      { id: "d1", type: "workflowNode", position: { x: 370, y: 140 }, data: { label: "Delay", type: "logic", kind: "delay", config: { durationMs: 500 } } },
      { id: "h1", type: "workflowNode", position: { x: 690, y: 140 }, data: { label: "HTTP Request", type: "action", kind: "action_http", config: { method: "POST", url: "https://your-n8n-instance/webhook/your-id", body: "{\"receivedFrom\": \"AutoFlow AI\", \"data\": {{payload}}}" } } },
      { id: "disc1", type: "workflowNode", position: { x: 1010, y: 140 }, data: { label: "Discord", type: "action", kind: "action_discord", config: { message: "Webhook relayed to n8n ✅" } } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "d1", animated: true, type: "smoothstep" },
      { id: "e2", source: "d1", target: "h1", animated: true, type: "smoothstep" },
      { id: "e3", source: "h1", target: "disc1", animated: true, type: "smoothstep" },
    ],
  },
];

export function getTemplate(id: string) {
  return workflowTemplates.find((t) => t.id === id);
}
