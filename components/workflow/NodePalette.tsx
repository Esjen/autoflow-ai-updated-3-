"use client";

import {
  Bot,
  MessageCircle,
  Database,
  Globe,
  Mail,
  GitBranch,
  ListTree,
  Repeat,
  Clock3,
  Hash,
  Send,
  Sheet,
  UserPlus,
} from "lucide-react";

import { useDraggable } from "@dnd-kit/core";
import { NODE_DEFINITIONS, type NodeKind, type NodeCategory } from "@/lib/types/nodes";

const ICONS: Record<NodeKind, typeof Bot> = {
  trigger_telegram: Send,
  trigger_whatsapp: MessageCircle,
  trigger_email: Mail,
  trigger_webhook: Globe,
  ai: Bot,
  condition: GitBranch,
  switch: ListTree,
  loop: Repeat,
  delay: Clock3,
  action_email: Mail,
  action_google_sheets: Sheet,
  action_slack: Hash,
  action_discord: MessageCircle,
  action_telegram: Send,
  action_http: Globe,
  database: Database,
  action_lead: UserPlus,
};

const CATEGORY_LABEL: Record<NodeCategory, string> = {
  trigger: "Triggers",
  ai: "AI",
  logic: "Logic",
  action: "Actions",
  database: "Data",
};

const CATEGORY_ORDER: NodeCategory[] = ["trigger", "ai", "logic", "action", "database"];

function PaletteNode({ node }: { node: (typeof NODE_DEFINITIONS)[number] }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: node.kind,
    data: { kind: node.kind, type: node.category, title: node.label },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const Icon = ICONS[node.kind];

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      title={node.description}
      className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:border-primary hover:bg-muted active:cursor-grabbing"
    >
      <Icon className="h-6 w-6 text-primary" />

      <div>
        <p className="font-medium">{node.label}</p>
        <p className="text-xs capitalize text-muted-foreground">
          {node.category}
        </p>
      </div>
    </button>
  );
}

export default function NodePalette() {
  return (
    <div className="w-72 space-y-6 rounded-3xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Node Library</h2>

      {CATEGORY_ORDER.map((category) => {
        const nodesForCategory = NODE_DEFINITIONS.filter((n) => n.category === category);
        if (nodesForCategory.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABEL[category]}
            </p>

            <div className="space-y-3">
              {nodesForCategory.map((node) => (
                <PaletteNode key={node.kind} node={node} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
