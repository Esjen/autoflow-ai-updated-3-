export type LeadStatus = "new" | "qualified" | "contacted" | "won" | "lost";

export interface Lead {
  id: string;
  user_id?: string;
  workflow_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  score?: number | null;
  status: LeadStatus;
  notes?: string | null;
  raw_payload?: unknown;
  created_at: string;
  updated_at: string;
}

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "qualified",
  "contacted",
  "won",
  "lost",
];
