import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  Bot,
  Play,
  Pencil,
  Trash2,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface WorkflowCardProps {
  id: string;

  title: string;
  description: string;

  trigger: string;
  aiModel: string;
  action: string;

  status: "Running" | "Draft" | "Paused";

  running: boolean;

  onRun: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function WorkflowCard({
  id,
  title,
  description,
  trigger,
  aiModel,
  action,
  status,
  running,
  onRun,
  onDelete,
  onEdit,
}: WorkflowCardProps) {
  return (
    <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* Clickable section */}
      <Link href={`/dashboard/workflows/${id}`}>
        <CardContent className="space-y-6 p-6 cursor-pointer">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />

                <h3 className="text-lg font-semibold">
                  {title}
                </h3>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            </div>

            <Badge
              variant={
                status === "Running"
                  ? "default"
                  : status === "Paused"
                  ? "secondary"
                  : "outline"
              }
            >
              {status}
            </Badge>
          </div>

          {/* Workflow Flow */}
          <div className="flex items-center justify-center gap-4 rounded-xl bg-muted/40 p-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Trigger
              </p>

              <p className="font-medium">
                {trigger}
              </p>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                AI Model
              </p>

              <p className="font-medium">
                {aiModel}
              </p>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Action
              </p>

              <p className="font-medium">
                {action}
              </p>
            </div>
          </div>

        </CardContent>
      </Link>

      {/* Buttons */}
      <div className="flex justify-end gap-2 px-6 pb-6">

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRun();
          }}
          disabled={running || status === "Running"}
        >
          {running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>

      </div>

    </Card>
  );
}