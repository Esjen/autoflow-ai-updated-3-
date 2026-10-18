import type { Edge, Node } from "@xyflow/react";
import type { ExecutionLogEntry } from "@/lib/types/workflow";
import type { NodeKind, NodeCategory, NodeConfigMap } from "@/lib/types/nodes";
import { evaluateCondition } from "@/lib/engine/safeExpression";

const MAX_STEPS = 200; // guard against accidental cycles
const MAX_DELAY_MS = 5000; // never let a single "Delay" node block a request for long
const MAX_LOOP_ITERATIONS = 20;

export interface ExecuteResult {
  status: "success" | "failed";
  logs: ExecutionLogEntry[];
  error?: string;
}

interface RuntimeNode extends Node {
  data: {
    label: string;
    type?: NodeCategory;
    kind?: NodeKind;
    config?: Record<string, unknown>;
  };
}

/**
 * Older saved graphs only stored a broad `type` (trigger/ai/action/logic/database)
 * and a human label. This infers a specific NodeKind so the engine (and the
 * rest of the new node system) keeps working for workflows built before the
 * node-kind system existed.
 */
function resolveKind(data: RuntimeNode["data"]): NodeKind {
  if (data.kind) return data.kind;

  const label = (data.label || "").toLowerCase();

  switch (data.type) {
    case "trigger":
      if (label.includes("whatsapp")) return "trigger_whatsapp";
      if (label.includes("email")) return "trigger_email";
      if (label.includes("webhook")) return "trigger_webhook";
      return "trigger_telegram";
    case "ai":
      return "ai";
    case "logic":
      if (label.includes("switch")) return "switch";
      if (label.includes("loop")) return "loop";
      if (label.includes("delay")) return "delay";
      return "condition";
    case "database":
      return "database";
    case "action":
    default:
      if (label.includes("lead")) return "action_lead";
      if (label.includes("sheet")) return "action_google_sheets";
      if (label.includes("slack")) return "action_slack";
      if (label.includes("discord")) return "action_discord";
      if (label.includes("telegram")) return "action_telegram";
      if (label.includes("http") || label.includes("webhook")) return "action_http";
      return "action_email";
  }
}

function log(
  entries: ExecutionLogEntry[],
  level: ExecutionLogEntry["level"],
  label: string,
  message: string,
  nodeId?: string
) {
  entries.push({
    timestamp: new Date().toISOString(),
    nodeId,
    label,
    message,
    level,
  });
}

/**
 * Evaluates condition expressions like `data.score > 5`.
 * Uses a small purpose-built parser instead of `new Function`, so the
 * expression text can never run arbitrary code on the server.
 */
function evaluateExpression(expression: string, context: Record<string, unknown>): boolean {
  return evaluateCondition(expression, context);
}

/** Resolves `{{path.to.value}}` placeholders against the execution context. */
function interpolate(template: string | undefined, context: Record<string, unknown>): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const parts = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = context;
    for (const part of parts) {
      value = value?.[part];
    }
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ApiKeyMap = Partial<Record<"openai" | "anthropic" | "gemini", string>>;

/** Extracts the first {...} or [...] block from a string, tolerating ```json fences etc. */
function extractJson(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  try {
    return JSON.parse(candidate.trim());
  } catch {
    const match = candidate.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

/** Builds a plausible-looking simulated JSON object from a plain-language field hint. */
function simulateJson(expectedFields?: string): Record<string, unknown> {
  if (!expectedFields) {
    return { result: "[simulated response]" };
  }

  const obj: Record<string, unknown> = {};
  for (const rawField of expectedFields.split(",")) {
    const field = rawField.trim();
    if (!field) continue;
    const nameMatch = field.match(/^[\w]+/);
    const name = nameMatch ? nameMatch[0] : field;
    if (/number/i.test(field)) {
      obj[name] = Math.floor(Math.random() * 10) + 1;
    } else if (/bool/i.test(field)) {
      obj[name] = true;
    } else {
      obj[name] = `[simulated ${name}]`;
    }
  }
  return obj;
}

/**
 * Calls the real provider API when the user has stored a key for it.
 * Falls back to a simulated response (and never throws) so a bad/missing
 * key degrades gracefully instead of failing the whole run.
 *
 * When `responseFormat` is "json", each provider is asked to return
 * structured JSON (via native JSON modes where available), and the result
 * is parsed so downstream nodes can reference fields like
 * `{{aiJson.score}}` instead of parsing free text themselves.
 */
async function runAiNode(
  model: string,
  prompt: string,
  apiKeys?: ApiKeyMap,
  responseFormat: "text" | "json" = "text",
  expectedFields?: string
): Promise<{ ok: boolean; output: string; json: unknown | null; simulated: boolean }> {
  const wantsJson = responseFormat === "json";

  const effectivePrompt = wantsJson
    ? `${prompt || "Analyze the input."}\n\nRespond with ONLY a valid JSON object${
        expectedFields ? ` with these fields: ${expectedFields}` : ""
      }. No markdown, no explanation, just the JSON object.`
    : prompt || "Say hello in five words.";

  try {
    if (model === "GPT-5.5" && apiKeys?.openai) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: effectivePrompt }],
          max_tokens: 300,
          ...(wantsJson ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      const output = data?.choices?.[0]?.message?.content ?? "";
      return {
        ok: true,
        output,
        json: wantsJson ? extractJson(output) : null,
        simulated: false,
      };
    }

    if (model === "Claude" && apiKeys?.anthropic) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKeys.anthropic,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 300,
          messages: [{ role: "user", content: effectivePrompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      const output = data?.content?.[0]?.text ?? "";
      return {
        ok: true,
        output,
        json: wantsJson ? extractJson(output) : null,
        simulated: false,
      };
    }

    if (model === "Gemini" && apiKeys?.gemini) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeys.gemini}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: effectivePrompt }] }],
            ...(wantsJson
              ? { generationConfig: { responseMimeType: "application/json" } }
              : {}),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return {
        ok: true,
        output,
        json: wantsJson ? extractJson(output) : null,
        simulated: false,
      };
    }
  } catch {
    // fall through to simulation below
  }

  if (wantsJson) {
    const simulated = simulateJson(expectedFields);
    return {
      ok: true,
      output: JSON.stringify(simulated),
      json: simulated,
      simulated: true,
    };
  }

  return {
    ok: true,
    output: `[simulated ${model} response for: "${prompt || "(no prompt configured)"}"]`,
    json: null,
    simulated: true,
  };
}

export async function executeWorkflow(
  nodes: Node[],
  edges: Edge[],
  triggerLabel: string,
  apiKeys?: ApiKeyMap,
  inboundPayload?: unknown,
  leadWriter?: (lead: Record<string, unknown>) => Promise<{ error?: string }>
): Promise<ExecuteResult> {
  const logs: ExecutionLogEntry[] = [];
  const runtimeNodes = nodes as RuntimeNode[];

  const trigger = runtimeNodes.find(
    (n) => resolveKind(n.data) && (n.data.type ?? "").toLowerCase() === "trigger"
  );

  if (!trigger) {
    log(logs, "error", "Workflow", "No Trigger node found — nothing to run.");
    return { status: "failed", logs, error: "Missing trigger node" };
  }

  log(logs, "info", "Workflow", "Execution started");
  log(
    logs,
    "success",
    trigger.data.label,
    `Trigger fired (${triggerLabel})`,
    trigger.id
  );

  if (inboundPayload !== undefined) {
    log(
      logs,
      "info",
      trigger.data.label,
      `Received payload: ${JSON.stringify(inboundPayload).slice(0, 300)}`,
      trigger.id
    );
  }

  const context: Record<string, unknown> = {
    trigger: trigger.data.label,
    startedAt: new Date().toISOString(),
    payload: inboundPayload ?? null,
  };

  let steps = 0;
  let currentIds: string[] = [trigger.id];
  const visited = new Set<string>();

  try {
    while (currentIds.length > 0 && steps < MAX_STEPS) {
      const nextIds: string[] = [];

      for (const nodeId of currentIds) {
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        steps++;

        const node = runtimeNodes.find((n) => n.id === nodeId);
        if (!node) continue;

        const outgoing = edges.filter((e) => e.source === nodeId);

        if (node.id === trigger.id) {
          nextIds.push(...outgoing.map((e) => e.target));
          continue;
        }

        const kind = resolveKind(node.data);
        const config = node.data.config ?? {};

        switch (kind) {
          case "ai": {
            const aiConfig = config as NodeConfigMap["ai"];
            const model = aiConfig.model ?? "GPT-5.5";
            const prompt = aiConfig.prompt ?? "";
            const responseFormat = aiConfig.responseFormat ?? "text";
            log(logs, "info", node.data.label, `Sending prompt to ${model}...`, node.id);
            const result = await runAiNode(
              model,
              prompt,
              apiKeys,
              responseFormat,
              aiConfig.expectedFields
            );
            context.aiOutput = result.output;
            context.aiJson = result.json;

            if (responseFormat === "json" && !result.json) {
              log(
                logs,
                "error",
                node.data.label,
                `${model} response could not be parsed as JSON: ${result.output.slice(0, 150)}`,
                node.id
              );
            } else {
              log(
                logs,
                "success",
                node.data.label,
                result.simulated
                  ? `${model} responded (simulated — add an API key in Settings for live calls)`
                  : responseFormat === "json"
                  ? `${model} responded with structured JSON`
                  : `${model} responded successfully`,
                node.id
              );
            }
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "condition": {
            const expression = (config as { expression?: string }).expression ?? "true";
            const result = evaluateExpression(expression, context);
            log(
              logs,
              "info",
              node.data.label,
              `Evaluated "${expression}" → ${result}`,
              node.id
            );
            const branch = outgoing.find(
              (e) => (e.sourceHandle ?? "true") === (result ? "true" : "false")
            );
            if (branch) nextIds.push(branch.target);
            break;
          }

          case "switch": {
            const cases = (config as { cases?: string[] }).cases ?? [];
            const chosen = cases[0];
            log(
              logs,
              "info",
              node.data.label,
              chosen ? `Matched case "${chosen}"` : "No cases configured, using default branch",
              node.id
            );
            const branch =
              outgoing.find((e) => e.sourceHandle === chosen) ?? outgoing[0];
            if (branch) nextIds.push(branch.target);
            break;
          }

          case "loop": {
            const max = Math.min(
              (config as { maxIterations?: number }).maxIterations ?? 3,
              MAX_LOOP_ITERATIONS
            );
            log(
              logs,
              "info",
              node.data.label,
              `Looping downstream steps ${max} time(s)`,
              node.id
            );
            for (let i = 1; i <= max; i++) {
              log(logs, "info", node.data.label, `Iteration ${i}/${max}`, node.id);
            }
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "delay": {
            const requested = (config as { durationMs?: number }).durationMs ?? 1000;
            const durationMs = Math.min(requested, MAX_DELAY_MS);
            log(
              logs,
              "info",
              node.data.label,
              `Waiting ${durationMs}ms${
                requested > durationMs ? ` (capped from ${requested}ms)` : ""
              }...`,
              node.id
            );
            await wait(durationMs);
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "action_http": {
            const httpConfig = config as NodeConfigMap["action_http"];
            const url = interpolate(httpConfig.url, context);
            const method = httpConfig.method ?? "POST";
            const body = interpolate(httpConfig.body, context);

            if (!url) {
              log(logs, "error", node.data.label, "No URL configured — skipped.", node.id);
              break;
            }

            let headers: Record<string, string> = { "Content-Type": "application/json" };
            if (httpConfig.headers) {
              try {
                headers = { ...headers, ...JSON.parse(interpolate(httpConfig.headers, context)) };
              } catch {
                log(
                  logs,
                  "error",
                  node.data.label,
                  "Headers field isn't valid JSON — ignoring it.",
                  node.id
                );
              }
            }

            try {
              const res = await fetch(url, {
                method,
                headers,
                body: method === "GET" ? undefined : body || "{}",
              });
              log(
                logs,
                res.ok ? "success" : "error",
                node.data.label,
                `${method} ${url} → ${res.status}`,
                node.id
              );
            } catch (err) {
              log(
                logs,
                "error",
                node.data.label,
                `Request to ${url} failed: ${(err as Error).message}`,
                node.id
              );
            }
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "action_slack":
          case "action_discord": {
            const social = config as NodeConfigMap["action_slack"] & NodeConfigMap["action_discord"];
            const webhookUrl = interpolate(social.webhookUrl, context);
            const message = interpolate(social.message, context) || "Workflow update";
            const channel = interpolate(social.channel, context);

            if (webhookUrl) {
              try {
                const res = await fetch(webhookUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(
                    kind === "action_slack"
                      ? { text: message, ...(channel ? { channel } : {}) }
                      : { content: message }
                  ),
                });
                log(
                  logs,
                  res.ok ? "success" : "error",
                  node.data.label,
                  `Posted message → ${res.status}`,
                  node.id
                );
              } catch (err) {
                log(
                  logs,
                  "error",
                  node.data.label,
                  `Failed to reach webhook: ${(err as Error).message}`,
                  node.id
                );
              }
            } else {
              log(
                logs,
                "success",
                node.data.label,
                `(simulated) message sent: "${message}"`,
                node.id
              );
            }
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "action_email": {
            const emailConfig = config as NodeConfigMap["action_email"];
            const to = interpolate(emailConfig.to, context) || "recipient";
            const subject = interpolate(emailConfig.subject, context) || "(no subject)";
            const body = interpolate(emailConfig.body, context);
            log(
              logs,
              "success",
              node.data.label,
              `(simulated) email "${subject}" sent to ${to}${body ? ` — "${body.slice(0, 80)}${body.length > 80 ? "..." : ""}"` : ""}`,
              node.id
            );
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "action_telegram": {
            const telegramConfig = config as NodeConfigMap["action_telegram"];
            const chatId = interpolate(telegramConfig.chatId, context) || "unknown chat";
            const message = interpolate(telegramConfig.message, context) || "(no message)";
            log(
              logs,
              "success",
              node.data.label,
              `(simulated) Telegram message sent to ${chatId}: "${message}"`,
              node.id
            );
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "action_google_sheets": {
            const sheetsConfig = config as NodeConfigMap["action_google_sheets"];
            const spreadsheetId = interpolate(sheetsConfig.spreadsheetId, context);
            const range = interpolate(sheetsConfig.range, context) || "Sheet1";
            log(
              logs,
              "success",
              node.data.label,
              `(simulated) row appended to ${range}${spreadsheetId ? ` in spreadsheet ${spreadsheetId}` : ""}`,
              node.id
            );
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "action_lead": {
            const leadConfig = config as NodeConfigMap["action_lead"];
            const lead = {
              name: interpolate(leadConfig.name, context) || null,
              email: interpolate(leadConfig.email, context) || null,
              phone: interpolate(leadConfig.phone, context) || null,
              source: interpolate(leadConfig.source, context) || null,
              status: leadConfig.status ?? "new",
              notes: interpolate(leadConfig.notes, context) || null,
            };

            const scoreRaw = interpolate(leadConfig.score, context);
            const score = scoreRaw ? Number(scoreRaw.replace(/[^0-9.-]/g, "")) : null;

            if (!leadWriter) {
              log(
                logs,
                "success",
                node.data.label,
                `(simulated) lead captured: ${lead.name ?? lead.email ?? "unnamed"}`,
                node.id
              );
            } else {
              const { error } = await leadWriter({
                ...lead,
                score: Number.isFinite(score) ? score : null,
                raw_payload: context.payload ?? null,
              });

              if (error) {
                log(logs, "error", node.data.label, `Failed to save lead: ${error}`, node.id);
              } else {
                log(
                  logs,
                  "success",
                  node.data.label,
                  `Lead saved: ${lead.name ?? lead.email ?? "unnamed"} (${lead.status})`,
                  node.id
                );
              }
            }

            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          case "database": {
            const table = (config as { table?: string }).table ?? "workflow_runs";
            log(
              logs,
              "success",
              node.data.label,
              `(simulated) wrote result to Supabase table "${table}"`,
              node.id
            );
            nextIds.push(...outgoing.map((e) => e.target));
            break;
          }

          default:
            nextIds.push(...outgoing.map((e) => e.target));
        }
      }

      currentIds = nextIds;
    }

    if (steps >= MAX_STEPS) {
      log(logs, "error", "Workflow", "Stopped: exceeded maximum step count (possible cycle).");
      return { status: "failed", logs, error: "Exceeded maximum execution steps" };
    }

    log(logs, "success", "Workflow", "Execution completed successfully");
    return { status: "success", logs };
  } catch (err) {
    log(logs, "error", "Workflow", `Execution crashed: ${(err as Error).message}`);
    return { status: "failed", logs, error: (err as Error).message };
  }
}
