"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import WorkflowCard from "@/components/dashboard/WorkflowCard";
import CreateWorkflowDialog from "@/components/dashboard/CreateWorkflowDialog";
import DeleteWorkflowDialog from "@/components/dashboard/DeleteWorkflowDialog";
import EmptyState from "@/components/dashboard/EmptyState";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WorkflowChart from "@/components/dashboard/WorkflowChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import type { Activity } from "@/lib/types/activity";

import { Input } from "@/components/ui/input";

import {
  Workflow as WorkflowIcon,
  PlayCircle,
  FileText,
  PauseCircle,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from "@/lib/actions/workflows";

import type {
  Workflow,
  WorkflowStatus,
} from "@/lib/types/workflow";

export default function DashboardClient() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingWorkflow, setEditingWorkflow] =
    useState<Workflow | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [workflowToDelete, setWorkflowToDelete] =
    useState<Workflow | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<WorkflowStatus | "All">("All");

  const [runningWorkflowId, setRunningWorkflowId] =
    useState<string | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);

  async function loadWorkflows() {
    try {
      const data = await getWorkflows();

      if (data) {
        setWorkflows(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load workflows.");
    }
  }

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function handleCreateWorkflow(
    workflow: Workflow
  ) {
    try {
      if (editingWorkflow) {
        await updateWorkflow(editingWorkflow.id, {
          title: workflow.title,
          description: workflow.description,
          trigger: workflow.trigger,
          aiModel: workflow.aiModel,
          action: workflow.action,
          status: workflow.status,
        });

        await loadWorkflows();

        toast.success(
          "Workflow updated successfully."
        );
        setActivities((prev) => [
  {
    id: crypto.randomUUID(),
    action: "updated",
    workflow: workflow.title,
    timestamp: new Date(),
  },
  ...prev,
]);

        setEditingWorkflow(null);
      } else {
        await createWorkflow({
          title: workflow.title,
          description: workflow.description,
          trigger: workflow.trigger,
          aiModel: workflow.aiModel,
          action: workflow.action,
          status: workflow.status,
        });

        await loadWorkflows();

        toast.success(
          "Workflow created successfully."
        );
        setActivities((prev) => [
  {
    id: crypto.randomUUID(),
    action: "created",
    workflow: workflow.title,
    timestamp: new Date(),
  },
  ...prev,
]);
      }
    } catch (error) {
      console.error(error);

      toast.error(
        editingWorkflow
          ? "Failed to update workflow."
          : "Failed to create workflow."
      );
    }
  }

  function handleDeleteWorkflow(
    workflow: Workflow
  ) {
    setWorkflowToDelete(workflow);
    setDeleteDialogOpen(true);
  }

  async function confirmDeleteWorkflow() {
    if (!workflowToDelete) return;

    try {
      await deleteWorkflow(workflowToDelete.id);

      await loadWorkflows();

      toast.success("Workflow deleted.");
      setActivities((prev) => [
  {
    id: crypto.randomUUID(),
    action: "deleted",
    workflow: workflowToDelete.title,
    timestamp: new Date(),
  },
  ...prev,
]);

      setWorkflowToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error(error);

      toast.error("Failed to delete workflow.");
    }
  }

  async function handleRunWorkflow(id: string) {
  const workflow = workflows.find((w) => w.id === id);

  if (!workflow) return;

  const previousStatus = workflow.status;

  setRunningWorkflowId(id);

  // Set workflow to Running
  setWorkflows((prev) =>
    prev.map((w) =>
      w.id === id
        ? {
            ...w,
            status: "Running",
          }
        : w
    )
  );

  toast.info("Running workflow...");

  // Simulate execution
  await new Promise((resolve) =>
    setTimeout(resolve, 2500)
  );

  // Restore previous status
  setWorkflows((prev) =>
    prev.map((w) =>
      w.id === id
        ? {
            ...w,
            status: previousStatus,
          }
        : w
    )
  );

  setRunningWorkflowId(null);

  toast.success("Workflow completed!");
  const executedWorkflow = workflows.find(
  (w) => w.id === id
);

if (executedWorkflow) {
  setActivities((prev) => [
    {
      id: crypto.randomUUID(),
      action: "executed",
      workflow: executedWorkflow.title,
      timestamp: new Date(),
    },
    ...prev,
  ]);
}
}
  function handleEditWorkflow(
    workflow: Workflow
  ) {
    setEditingWorkflow(workflow);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(
    open: boolean
  ) {
    setDialogOpen(open);

    if (!open) {
      setEditingWorkflow(null);
    }
  }

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        workflow.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        workflow.description
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        workflow.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    workflows,
    search,
    statusFilter,
  ]);

  const stats = useMemo(() => {
  const total = workflows.length;

  const running = workflows.filter(
    (workflow) => workflow.status === "Running"
  ).length;

  const draft = workflows.filter(
    (workflow) => workflow.status === "Draft"
  ).length;

  const paused = workflows.filter(
    (workflow) => workflow.status === "Paused"
  ).length;

  return {
    total,
    running,
    draft,
    paused,
  };
}, [workflows]);

  return (
    <DashboardLayout>
      <DashboardHeader />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
  <StatsCard
    title="Total Workflows"
    value={stats.total.toString()}
    icon={<WorkflowIcon className="h-6 w-6" />}
  />

  <StatsCard
    title="Running"
    value={stats.running.toString()}
    icon={<PlayCircle className="h-6 w-6" />}
  />

  <StatsCard
    title="Draft"
    value={stats.draft.toString()}
    icon={<FileText className="h-6 w-6" />}
  />

  <StatsCard
    title="Paused"
    value={stats.paused.toString()}
    icon={<PauseCircle className="h-6 w-6" />}
  />
</div>
   
    {/* Chart */}
<div className="mt-8">
  <WorkflowChart
    running={stats.running}
    draft={stats.draft}
    paused={stats.paused}
  />
</div>

      <div className="mt-12">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-bold">
            Recent Workflows
          </h2>

          <button
            onClick={() => {
              setEditingWorkflow(null);
              setDialogOpen(true);
            }}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            + New Workflow
          </button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Search workflows..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(
                value as WorkflowStatus | "All"
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="All">
                All Statuses
              </SelectItem>

              <SelectItem value="Running">
                Running
              </SelectItem>

              <SelectItem value="Draft">
                Draft
              </SelectItem>

              <SelectItem value="Paused">
                Paused
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredWorkflows.length === 0 ? (
  <EmptyState
    onCreate={() => {
      setEditingWorkflow(null);
      setDialogOpen(true);
    }}
  />
) : (
  <div className="grid gap-6 lg:grid-cols-3">
    {/* Workflow List */}
    <div className="space-y-4 lg:col-span-2">
      {filteredWorkflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          id={workflow.id}
          title={workflow.title}
          description={workflow.description}
          trigger={workflow.trigger}
          aiModel={workflow.aiModel}
          action={workflow.action}
          status={workflow.status}
          running={runningWorkflowId === workflow.id}
          onRun={() => handleRunWorkflow(workflow.id)}
          onDelete={() => handleDeleteWorkflow(workflow)}
          onEdit={() => handleEditWorkflow(workflow)}
        />
      ))}
    </div>

    {/* Recent Activity */}
    <RecentActivity activities={activities} />
  </div>
)}

</div>

      <CreateWorkflowDialog
        open={dialogOpen}
        onOpenChange={
          handleDialogOpenChange
        }
        onCreate={handleCreateWorkflow}
        editingWorkflow={
          editingWorkflow
        }
      />

      <DeleteWorkflowDialog
        open={deleteDialogOpen}
        onOpenChange={
          setDeleteDialogOpen
        }
        workflowTitle={
          workflowToDelete?.title ?? ""
        }
        onConfirm={
          confirmDeleteWorkflow
        }
      />
    </DashboardLayout>
  );
}