import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus } from "@/lib/types/leads";

const supabase = createClient();

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }

  return data ?? [];
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);

  if (error) {
    console.error("Failed to update lead status:", error);
    throw new Error(error.message);
  }
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from("leads").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete lead:", error);
    throw new Error(error.message);
  }
}
