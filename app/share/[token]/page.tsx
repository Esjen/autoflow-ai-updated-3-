"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import ReadOnlyCanvas from "@/components/workflow/ReadOnlyCanvas";
import { getSharedWorkflow } from "@/lib/actions/shares";

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const [workflow, setWorkflow] = useState<Awaited<ReturnType<typeof getSharedWorkflow>>>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getSharedWorkflow(params.token)
      .then((data) => {
        if (!data) {
          setNotFound(true);
        } else {
          setWorkflow(data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading shared workflow...</p>
      </main>
    );
  }

  if (notFound || !workflow) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          This share link is invalid or has been revoked.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Shared read-only view · AutoFlow AI
          </p>
          <h1 className="text-3xl font-bold">{workflow.title}</h1>
          <p className="mt-2 text-muted-foreground">{workflow.description}</p>
        </div>

        <ReadOnlyCanvas
          nodes={Array.isArray(workflow.nodes) ? (workflow.nodes as never) : []}
          edges={Array.isArray(workflow.edges) ? (workflow.edges as never) : []}
        />
      </div>
    </main>
  );
}
