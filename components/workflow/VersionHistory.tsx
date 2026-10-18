"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getVersions } from "@/lib/actions/versions";
import type { WorkflowVersion } from "@/lib/types/workflow";

interface Props {
  workflowId: string;
}

export default function VersionHistory({ workflowId }: Props) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    getVersions(workflowId)
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [open, workflowId]);

  function handleRestore(version: WorkflowVersion) {
    window.dispatchEvent(
      new CustomEvent("restore-version", {
        detail: { nodes: version.nodes, edges: version.edges },
      })
    );
    toast.success("Version restored. Don't forget to Save.");
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <History className="mr-2 h-4 w-4" />
        Version History
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved versions yet. Click &quot;Save Workflow&quot; to create one.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-xl border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {version.nodes.length} nodes • {version.edges.length} connections
                    </p>
                  </div>

                  <Button size="sm" variant="outline" onClick={() => handleRestore(version)}>
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
