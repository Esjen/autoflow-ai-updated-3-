"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Trash2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getLeads, updateLeadStatus, deleteLead } from "@/lib/actions/leads";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/types/leads";

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  qualified: "Qualified",
  contacted: "Contacted",
  won: "Won",
  lost: "Lost",
};

const STATUS_BADGE: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "outline",
  qualified: "default",
  contacted: "secondary",
  won: "default",
  lost: "destructive",
};

function LeadCard({
  lead,
  onStatusChange,
  onDelete,
}: {
  lead: Lead;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{lead.name || "Unnamed lead"}</p>
          {lead.source && (
            <p className="text-xs text-muted-foreground">via {lead.source}</p>
          )}
        </div>

        {lead.score !== null && lead.score !== undefined && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {lead.score}
          </Badge>
        )}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {lead.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {lead.email}
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {lead.phone}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Select
          value={lead.status}
          onValueChange={(value) => value && onStatusChange(lead.id, value as LeadStatus)}
        >
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="icon" variant="ghost" onClick={() => onDelete(lead.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getLeads();
    setLeads(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await updateLeadStatus(id, status);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update lead status.");
      load();
    }
  }

  async function handleDelete(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteLead(id);
      toast.success("Lead removed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove lead.");
      load();
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="mt-2 text-muted-foreground">
          Every lead your workflows have captured, scored, and routed — all in one pipeline.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading leads...</p>
      ) : leads.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-12 text-center">
          <p className="font-medium">No leads yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a &quot;Create/Update Lead&quot; node to a workflow (the AI Lead
            Qualification template includes one) and run it to see leads appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-5">
          {LEAD_STATUSES.map((status) => {
            const columnLeads = leads.filter((l) => l.status === status);

            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{STATUS_LABEL[status]}</h2>
                  <Badge variant={STATUS_BADGE[status]}>{columnLeads.length}</Badge>
                </div>

                <div className="space-y-3">
                  {columnLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
