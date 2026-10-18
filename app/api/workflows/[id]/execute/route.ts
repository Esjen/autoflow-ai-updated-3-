import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { runAndPersistExecution } from "@/lib/engine/run";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .select("id, trigger, nodes, edges, user_id")
    .eq("id", id)
    .single();

  if (workflowError || !workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  if (workflow.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { result, execution, insertError } = await runAndPersistExecution(
    supabase,
    workflow,
    workflow.trigger ?? "Manual"
  );

  if (insertError) {
    // The run itself still happened — surface the logs even if we couldn't persist them.
    return NextResponse.json(
      { ...result, persistError: insertError.message },
      { status: 200 }
    );
  }

  return NextResponse.json({ ...result, execution });
}
