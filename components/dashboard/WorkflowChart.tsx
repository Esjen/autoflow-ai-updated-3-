"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  running: number;
  draft: number;
  paused: number;
}

export default function WorkflowChart({
  running,
  draft,
  paused,
}: Props) {
  const data = [
    {
      status: "Running",
      total: running,
    },
    {
      status: "Draft",
      total: draft,
    },
    {
      status: "Paused",
      total: paused,
    },
  ];

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold">
        Workflow Analytics
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="4 4" />

            <XAxis dataKey="status" />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Bar
              dataKey="total"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}