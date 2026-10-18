"use client";

import { Node } from "@xyflow/react";
import type { NodeKind } from "@/lib/types/nodes";

interface Props {
  node: Node | null;
  onUpdateLabel: (id: string, label: string) => void;
  onUpdateConfig: (id: string, config: Record<string, unknown>) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "mt-2 w-full rounded-lg border p-2 text-sm";

function TemplatingHint() {
  return (
    <p className="rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
      Use <code>{"{{payload.field}}"}</code> for inbound webhook data,{" "}
      <code>{"{{aiOutput}}"}</code> for the AI node&apos;s raw text, or{" "}
      <code>{"{{aiJson.field}}"}</code> when the AI node returns structured JSON.
    </p>
  );
}

export default function NodeSettings({ node, onUpdateLabel, onUpdateConfig }: Props) {
  if (!node) {
    return (
      <div className="w-80 rounded-3xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Select a node</p>
      </div>
    );
  }

  const kind = node.data.kind as NodeKind | undefined;
  const config = (node.data.config as Record<string, unknown>) ?? {};

  function set(key: string, value: unknown) {
    onUpdateConfig(node!.id, { ...config, [key]: value });
  }

  return (
    <div className="w-80 space-y-5 rounded-3xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Node Settings</h2>

      <Field label="Name">
        <input
          className={inputClass}
          value={(node.data.label as string) ?? ""}
          onChange={(e) => onUpdateLabel(node.id, e.target.value)}
        />
      </Field>

      <Field label="Type">
        <input
          className={`${inputClass} bg-muted`}
          value={(node.data.type as string) ?? ""}
          readOnly
        />
      </Field>

      {kind === "ai" && (
        <>
          <Field label="Model">
            <select
              className={inputClass}
              value={(config.model as string) ?? "GPT-5.5"}
              onChange={(e) => set("model", e.target.value)}
            >
              <option value="GPT-5.5">GPT-5.5</option>
              <option value="Gemini">Gemini</option>
              <option value="Claude">Claude</option>
            </select>
          </Field>
          <Field label="Prompt">
            <textarea
              className={inputClass}
              rows={4}
              value={(config.prompt as string) ?? ""}
              onChange={(e) => set("prompt", e.target.value)}
              placeholder="Summarize the incoming message..."
            />
          </Field>
          <Field label="Response format">
            <select
              className={inputClass}
              value={(config.responseFormat as string) ?? "text"}
              onChange={(e) => set("responseFormat", e.target.value)}
            >
              <option value="text">Plain text</option>
              <option value="json">Structured JSON</option>
            </select>
          </Field>
          {config.responseFormat === "json" && (
            <Field label="Expected fields">
              <input
                className={inputClass}
                value={(config.expectedFields as string) ?? ""}
                onChange={(e) => set("expectedFields", e.target.value)}
                placeholder="score (number 1-10), reason (string)"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Downstream nodes can reference this with{" "}
                <code>{"{{aiJson.score}}"}</code>, <code>{"{{aiJson.reason}}"}</code>, etc.
              </p>
            </Field>
          )}
        </>
      )}

      {kind === "condition" && (
        <Field label="Expression (JS, uses `data.*`)">
          <input
            className={inputClass}
            value={(config.expression as string) ?? ""}
            onChange={(e) => set("expression", e.target.value)}
            placeholder="data.aiOutput.length > 0"
          />
        </Field>
      )}

      {kind === "switch" && (
        <Field label="Cases (comma separated)">
          <input
            className={inputClass}
            value={((config.cases as string[]) ?? []).join(", ")}
            onChange={(e) =>
              set(
                "cases",
                e.target.value
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean)
              )
            }
            placeholder="urgent, normal, low"
          />
        </Field>
      )}

      {kind === "loop" && (
        <Field label="Max iterations">
          <input
            type="number"
            className={inputClass}
            value={(config.maxIterations as number) ?? 3}
            onChange={(e) => set("maxIterations", Number(e.target.value))}
          />
        </Field>
      )}

      {kind === "delay" && (
        <Field label="Duration (ms, capped at 5000)">
          <input
            type="number"
            className={inputClass}
            value={(config.durationMs as number) ?? 1000}
            onChange={(e) => set("durationMs", Number(e.target.value))}
          />
        </Field>
      )}

      {kind === "action_http" && (
        <>
          <TemplatingHint />
          <Field label="URL">
            <input
              className={inputClass}
              value={(config.url as string) ?? ""}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://your-n8n-instance/webhook/{{payload.id}}"
            />
          </Field>
          <Field label="Method">
            <select
              className={inputClass}
              value={(config.method as string) ?? "POST"}
              onChange={(e) => set("method", e.target.value)}
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
          </Field>
          <Field label="Headers (JSON)">
            <textarea
              className={inputClass}
              rows={2}
              value={(config.headers as string) ?? ""}
              onChange={(e) => set("headers", e.target.value)}
              placeholder='{"Authorization": "Bearer {{payload.token}}"}'
            />
          </Field>
          <Field label="Body (JSON)">
            <textarea
              className={inputClass}
              rows={3}
              value={(config.body as string) ?? ""}
              onChange={(e) => set("body", e.target.value)}
              placeholder='{"lead": "{{aiJson.reason}}", "score": {{aiJson.score}}}'
            />
          </Field>
        </>
      )}

      {(kind === "action_slack" || kind === "action_discord") && (
        <>
          <TemplatingHint />
          <Field label="Webhook URL">
            <input
              className={inputClass}
              value={(config.webhookUrl as string) ?? ""}
              onChange={(e) => set("webhookUrl", e.target.value)}
              placeholder="https://hooks.slack.com/... or Discord webhook"
            />
          </Field>
          {kind === "action_slack" && (
            <Field label="Channel">
              <input
                className={inputClass}
                value={(config.channel as string) ?? ""}
                onChange={(e) => set("channel", e.target.value)}
                placeholder="#general"
              />
            </Field>
          )}
          <Field label="Message">
            <textarea
              className={inputClass}
              rows={3}
              value={(config.message as string) ?? ""}
              onChange={(e) => set("message", e.target.value)}
              placeholder="New lead scored {{aiJson.score}}/10: {{aiJson.reason}}"
            />
          </Field>
        </>
      )}

      {kind === "action_email" && (
        <>
          <TemplatingHint />
          <Field label="To">
            <input
              className={inputClass}
              value={(config.to as string) ?? ""}
              onChange={(e) => set("to", e.target.value)}
              placeholder="{{payload.email}}"
            />
          </Field>
          <Field label="Subject">
            <input
              className={inputClass}
              value={(config.subject as string) ?? ""}
              onChange={(e) => set("subject", e.target.value)}
            />
          </Field>
          <Field label="Body">
            <textarea
              className={inputClass}
              rows={3}
              value={(config.body as string) ?? ""}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Hi {{payload.name}}, thanks for reaching out..."
            />
          </Field>
        </>
      )}

      {kind === "action_telegram" && (
        <>
          <TemplatingHint />
          <Field label="Chat ID">
            <input
              className={inputClass}
              value={(config.chatId as string) ?? ""}
              onChange={(e) => set("chatId", e.target.value)}
              placeholder="{{payload.chatId}}"
            />
          </Field>
          <Field label="Message">
            <textarea
              className={inputClass}
              rows={3}
              value={(config.message as string) ?? ""}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Score: {{aiJson.score}}"
            />
          </Field>
        </>
      )}

      {kind === "action_google_sheets" && (
        <>
          <TemplatingHint />
          <Field label="Spreadsheet ID">
            <input
              className={inputClass}
              value={(config.spreadsheetId as string) ?? ""}
              onChange={(e) => set("spreadsheetId", e.target.value)}
            />
          </Field>
          <Field label="Range">
            <input
              className={inputClass}
              value={(config.range as string) ?? ""}
              onChange={(e) => set("range", e.target.value)}
              placeholder="Sheet1!A:D"
            />
          </Field>
        </>
      )}

      {kind === "action_lead" && (
        <>
          <TemplatingHint />
          <Field label="Name">
            <input
              className={inputClass}
              value={(config.name as string) ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="{{payload.name}}"
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              value={(config.email as string) ?? ""}
              onChange={(e) => set("email", e.target.value)}
              placeholder="{{payload.email}}"
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              value={(config.phone as string) ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="{{payload.phone}}"
            />
          </Field>
          <Field label="Source">
            <input
              className={inputClass}
              value={(config.source as string) ?? ""}
              onChange={(e) => set("source", e.target.value)}
              placeholder="Telegram"
            />
          </Field>
          <Field label="Score">
            <input
              className={inputClass}
              value={(config.score as string) ?? ""}
              onChange={(e) => set("score", e.target.value)}
              placeholder="{{aiOutput}}"
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={(config.status as string) ?? "new"}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="contacted">Contacted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </Field>
          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={3}
              value={(config.notes as string) ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="{{aiJson.reason}}"
            />
          </Field>
        </>
      )}

      {kind === "database" && (
        <Field label="Table">
          <input
            className={inputClass}
            value={(config.table as string) ?? ""}
            onChange={(e) => set("table", e.target.value)}
            placeholder="workflow_runs"
          />
        </Field>
      )}
    </div>
  );
}
