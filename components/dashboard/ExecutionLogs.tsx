import { Badge } from "@/components/ui/badge";

const logs = [
  {
    id: 1,
    status: "Success",
    started: "Today • 2:14 PM",
    duration: "2.3s",
    trigger: "Telegram",
    result: "Completed",
  },
  {
    id: 2,
    status: "Failed",
    started: "Yesterday • 3:12 PM",
    duration: "0.8s",
    trigger: "Webhook",
    result: "API Timeout",
  },
  {
    id: 3,
    status: "Running",
    started: "Now",
    duration: "--",
    trigger: "Schedule",
    result: "Executing",
  },
];

export default function ExecutionLogs() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">

      <h2 className="mb-6 text-xl font-semibold">
        Execution Logs
      </h2>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="pb-3 text-left text-sm">
                Status
              </th>

              <th className="pb-3 text-left text-sm">
                Started
              </th>

              <th className="pb-3 text-left text-sm">
                Duration
              </th>

              <th className="pb-3 text-left text-sm">
                Trigger
              </th>

              <th className="pb-3 text-left text-sm">
                Result
              </th>

            </tr>

          </thead>

          <tbody>

            {logs.map((log) => (

              <tr
                key={log.id}
                className="border-b transition hover:bg-muted/40"
              >

                <td className="py-4">

                  <Badge
                    variant={
                      log.status === "Success"
                        ? "default"
                        : log.status === "Failed"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {log.status}
                  </Badge>

                </td>

                <td>{log.started}</td>

                <td>{log.duration}</td>

                <td>{log.trigger}</td>

                <td>{log.result}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}