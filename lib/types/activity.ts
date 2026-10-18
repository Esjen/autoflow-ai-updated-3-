export interface Activity {
  id: string;
  action: "created" | "updated" | "deleted" | "executed";
  workflow: string;
  timestamp: Date;
}