import { Bot, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreate: () => void;
}

export default function EmptyState({
  onCreate,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-8 py-20 text-center">
      <div className="mb-6 rounded-full bg-primary/10 p-5">
        <Bot className="h-12 w-12 text-primary" />
      </div>

      <h3 className="text-2xl font-bold">
        No workflows yet
      </h3>

      <p className="mt-3 max-w-md text-muted-foreground">
        Create your first AI workflow to start
        automating repetitive tasks and boost your
        productivity.
      </p>

      <Button
        className="mt-8"
        onClick={onCreate}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Workflow
      </Button>
    </div>
  );
}