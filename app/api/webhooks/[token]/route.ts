import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { runAndPersistExecution } from "@/lib/engine/run";

interface Params {
  params: Promise<{ token: string }>;
}

/**
 * GET is a lightweight health check — useful when a service (n8n, Postman,
 * a browser) just wants to confirm the URL is live before wiring it up.
 */
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: workflow } = await supabase
    .from("workflows")
    .select("id, title")
    .eq("webhook_token", token)
    .maybeSingle();

  if (!workflow) {
    return NextResponse.json({ error: "Unknown webhook token" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    workflow: workflow.title,
    message: "This webhook is live. Send a POST request to trigger the workflow.",
  });
}

/**
 * POST actually runs the workflow. Anything in the request body is passed
 * through to the execution engine as `data.payload`, so a Condition node
 * could use an expression like `data.payload.priority === "high"`.
 */
export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .select("id, trigger, nodes, edges, user_id")
    .eq("webhook_token", token)
    .maybeSingle();

  if (workflowError || !workflow) {
    return NextResponse.json({ error: "Unknown webhook token" }, { status: 404 });
  }

  let payload: unknown = null;
  try {
    const text = await request.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON body — still fine, we just won't have structured payload data.
    payload = null;
  }

  const { result, execution, insertError } = await runAndPersistExecution(
    supabase,
    workflow,
    "Webhook",
    payload
  );

  if (insertError) {
    return NextResponse.json(
      { ...result, persistError: insertError.message },
      { status: 200 }
    );
  }

  return NextResponse.json({ ...result, execution });
}
