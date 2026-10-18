"use client";

import { Activity } from "@/lib/types/activity";
import {
  PlusCircle,
  Pencil,
  Trash2,
  PlayCircle,
} from "lucide-react";

interface Props {
  activities: Activity[];
}

export default function RecentActivity({
  activities,
}: Props) {
  const getIcon = (action: Activity["action"]) => {
    switch (action) {
      case "created":
        return <PlusCircle className="h-5 w-5 text-green-500" />;

      case "updated":
        return <Pencil className="h-5 w-5 text-blue-500" />;

      case "deleted":
        return <Trash2 className="h-5 w-5 text-red-500" />;

      case "executed":
        return <PlayCircle className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold">
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recent activity.
        </p>
      ) : (
        <div className="space-y-5">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3"
            >
              {getIcon(activity.action)}

              <div>
                <p className="font-medium">
                  {activity.workflow}
                </p>

                <p className="text-sm text-muted-foreground capitalize">
                  {activity.action}
                </p>

                <p className="text-xs text-muted-foreground">
                  {activity.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}