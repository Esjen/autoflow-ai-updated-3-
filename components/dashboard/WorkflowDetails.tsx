"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { getWorkflows, updateWorkflow, deleteWorkflow } from "@/lib/actions/workflows";
import { getExecutions, runWorkflow } from "@/lib/actions/executions";
import type { Workflow, WorkflowExecution, ExecutionLogEntry } from "@/lib/types/workflow";

import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import VersionHistory from "@/components/workflow/VersionHistory";
import ShareDialog from "@/components/workflow/ShareDialog";
import CreateWorkflowDialog from "@/components/dashboard/CreateWorkflowDialog";
import DeleteWorkflowDialog from "@/components/dashboard/DeleteWorkflowDialog";

interface Props {
  workflowId: string;
}

export default function WorkflowDetails({ workflowId }: Props) {
  const router = useRouter();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [running, setRunning] = useState(false);
  const [liveLogs, setLiveLogs] = useState<ExecutionLogEntry[] | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);

  const loadWorkflow = useCallback(async () => {
    const workflows = await getWorkflows();
    const found = workflows.find((w) => w.id === workflowId);
    if (found) setWorkflow(found);
  }, [workflowId]);

  const loadExecutions = useCallback(async () => {
    const data = await getExecutions(workflowId);
    setExecutions(data);
  }, [workflowId]);

  useEffect(() => {
    loadWorkflow();
    loadExecutions();
  }, [loadWorkflow, loadExecutions]);

  async function handleRun() {
    setRunning(true);
    setLiveLogs(null);

    // Make sure the latest canvas edits are persisted before we run.
    window.dispatchEvent(new Event("save-workflow"));

    try {
      // small delay so the debounced autosave above has a moment to land
      await new Promise((r) => setTimeout(r, 600));
      const result = await runWorkflow(workflowId);
      setLiveLogs(result.logs);

      if (result.status === "success") {
        toast.success("Workflow ran successfully.");
      } else {
        toast.error(`Workflow run failed${result.error ? `: ${result.error}` : ""}`);
      }

      await loadExecutions();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to run workflow.");
    } finally {
      setRunning(false);
    }
  }

  function handleSave() {
    window.dispatchEvent(new Event("save-workflow"));
    toast.success("Workflow saved.");
  }

  function handleCopyWebhookUrl() {
    if (!workflow?.webhookToken || typeof window === "undefined") return;
    navigator.clipboard.writeText(
      `${window.location.origin}/api/webhooks/${workflow.webhookToken}`
    );
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 1500);
  }

  async function handleEditSave(updated: Workflow) {
    if (!workflow) return;
    try {
      const saved = await updateWorkflow(workflow.id, updated);
      setWorkflow(saved);
      toast.success("Workflow details updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update workflow.");
    }
  }

  async function handleDelete() {
    if (!workflow) return;
    try {
      await deleteWorkflow(workflow.id);
      toast.success("Workflow deleted.");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete workflow.");
    }
  }

  if (!workflow) {
    return <div className="py-20 text-center">Loading workflow...</div>;
  }

  const lastExecution = executions[0];
  const successCount = executions.filter((e) => e.status === "success").length;
  const successRate =
    executions.length > 0 ? Math.round((successCount / executions.length) * 100) : null;
  const avgDuration =
    executions.length > 0
      ? Math.round(
          executions.reduce((sum, e) => sum + (e.duration_ms ?? 0), 0) / executions.length
        )
      : null;

  const displayedLogs = liveLogs ?? lastExecution?.logs ?? [];

  const webhookUrl =
    workflow.webhookToken && typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/${workflow.webhookToken}`
      : "";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* ================= HEADER ================= */}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">{workflow.title}</h1>

            <Badge
              variant={
                workflow.status === "Running"
                  ? "default"
                  : workflow.status === "Paused"
                  ? "secondary"
                  : "outline"
              }
            >
              {workflow.status}
            </Badge>
          </div>

          <p className="mt-3 text-muted-foreground">{workflow.description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRun} disabled={running}>
            {running ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            {running ? "Running..." : "Run Workflow"}
          </Button>

          <Button variant="outline" onClick={handleSave}>
            Save Workflow
          </Button>

          <VersionHistory workflowId={workflow.id} />

          <ShareDialog workflowId={workflow.id} />

          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* ================= VISUAL BUILDER ================= */}

      <div className="rounded-3xl border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Visual Workflow Builder</h2>
          <p className="text-sm text-muted-foreground">
            Drag and connect workflow nodes visually.
          </p>
        </div>

        <WorkflowCanvas workflowId={workflow.id} />
      </div>

      {/* ================= INFO GRID ================= */}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* DETAILS */}
        <div className="rounded-2xl border p-6">
          <h2 className="mb-5 text-lg font-semibold">Workflow Details</h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span>Status</span>
              <strong>{workflow.status}</strong>
            </div>
            <div className="flex justify-between">
              <span>Trigger</span>
              <strong>{workflow.trigger}</strong>
            </div>
            <div className="flex justify-between">
              <span>AI Model</span>
              <strong>{workflow.aiModel}</strong>
            </div>
            <div className="flex justify-between">
              <span>Action</span>
              <strong>{workflow.action}</strong>
            </div>
          </div>

          {workflow.webhookToken && (
            <div className="mt-5 border-t pt-5">
              <p className="mb-2 text-sm font-medium">Trigger URL</p>
              <p className="mb-2 text-xs text-muted-foreground">
                POST to this URL (e.g. from n8n, Telegram, or any service) to run this workflow.
              </p>
              <div className="flex gap-2">
                <code className="flex-1 truncate rounded-lg bg-muted px-2 py-1.5 text-xs">
                  {webhookUrl}
                </code>
                <Button size="icon" variant="outline" onClick={handleCopyWebhookUrl}>
                  {webhookCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ANALYTICS */}
        <div className="rounded-2xl border p-6">
          <h2 className="mb-5 text-lg font-semibold">Analytics</h2>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Runs</p>
              <p className="text-4xl font-bold">{executions.length}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-4xl font-bold text-green-600">
                {successRate !== null ? `${successRate}%` : "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Average Runtime</p>
              <p className="text-xl font-semibold">
                {avgDuration !== null ? `${(avgDuration / 1000).toFixed(2)}s` : "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Last Execution</p>
              <p className="font-semibold">
                {lastExecution
                  ? new Date(lastExecution.started_at).toLocaleString()
                  : "Never run yet"}
              </p>
            </div>
          </div>
        </div>

        {/* EXECUTION HISTORY */}
        <div className="rounded-2xl border p-6">
          <h2 className="mb-5 text-lg font-semibold">Execution History</h2>

          {executions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No runs yet — click &quot;Run Workflow&quot; to try it out.
            </p>
          ) : (
            <div className="space-y-4">
              {executions.slice(0, 6).map((execution) => (
                <div key={execution.id} className="flex items-center gap-3">
                  {execution.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                  )}

                  <div>
                    <p className="font-medium capitalize">{execution.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(execution.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= EXECUTION LOGS ================= */}

      <div className="rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          {liveLogs ? "Live Execution Logs" : "Last Execution Logs"}
        </h2>

        <div className="space-y-3 rounded-xl bg-muted/40 p-5 font-mono text-sm">
          {displayedLogs.length === 0 ? (
            <p className="text-muted-foreground">
              No logs yet. Run the workflow to see step-by-step output here.
            </p>
          ) : (
            displayedLogs.map((entry, i) => (
              <div
                key={i}
                className={
                  entry.level === "success"
                    ? "text-green-600"
                    : entry.level === "error"
                    ? "text-red-600"
                    : ""
                }
              >
                [{new Date(entry.timestamp).toLocaleTimeString()}] {entry.label}: {entry.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap justify-end gap-4">
        <Button onClick={handleRun} disabled={running}>
          <PlayCircle className="mr-2 h-4 w-4" />
          Run Workflow
        </Button>

        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Workflow
        </Button>

        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Workflow
        </Button>
      </div>

      <CreateWorkflowDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onCreate={handleEditSave}
        editingWorkflow={workflow}
      />

      <DeleteWorkflowDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        workflowTitle={workflow.title}
      />
    </div>
  );
}
