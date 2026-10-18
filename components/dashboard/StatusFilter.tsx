"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { WorkflowStatus } from "@/lib/types/workflow";

interface Props {
  value: WorkflowStatus | "All";
  onChange: (
    value: WorkflowStatus | "All"
  ) => void;
}

export default function StatusFilter({
  value,
  onChange,
}: Props) {
  return (
    <Select
      value={value}
      onValueChange={(value) =>
        onChange(value as WorkflowStatus | "All")
      }
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
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
  );
}