"use client";

import { Handle, Position } from "@xyflow/react";
import {
  Bot,
  MessageCircle,
  Zap,
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

import type { NodeKind, NodeCategory } from "@/lib/types/nodes";

interface Props {
  data: {
    label: string;
    type: NodeCategory;
    kind?: NodeKind;
    config?: Record<string, unknown>;
  };
}

const ICONS: Partial<Record<NodeKind, typeof Bot>> = {
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

const CATEGORY_STYLE: Record<NodeCategory, { icon: string; badge: string }> = {
  trigger: { icon: "text-blue-500", badge: "bg-blue-100 text-blue-700" },
  ai: { icon: "text-violet-500", badge: "bg-violet-100 text-violet-700" },
  logic: { icon: "text-amber-500", badge: "bg-amber-100 text-amber-700" },
  action: { icon: "text-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  database: { icon: "text-green-500", badge: "bg-green-100 text-green-700" },
};

export default function WorkflowNode({ data }: Props) {
  const category: NodeCategory = data.type ?? "action";
  const kind = data.kind;
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.action;
  const Icon = (kind && ICONS[kind]) || Zap;

  const isCondition = kind === "condition";
  const isSwitch = kind === "switch";
  const cases = isSwitch ? ((data.config?.cases as string[]) ?? []) : [];

  return (
    <div className="min-w-[220px] rounded-2xl border border-border bg-card p-5 shadow-lg transition-all hover:shadow-xl">
      {category !== "trigger" && (
        <Handle id="left" type="target" position={Position.Left} />
      )}

      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-muted p-3">
          <Icon className={`h-6 w-6 ${style.icon}`} />
        </div>

        <div className="flex-1">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${style.badge}`}
          >
            {category}
          </span>

          <h3 className="mt-2 text-lg font-semibold">{data.label}</h3>
        </div>
      </div>

      {/* Branching nodes expose multiple named outputs */}
      {isCondition && (
        <div className="mt-3 flex justify-between text-[10px] font-medium text-muted-foreground">
          <span>true</span>
          <span>false</span>
        </div>
      )}

      {isCondition ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            style={{ left: "30%" }}
          />
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            style={{ left: "70%" }}
          />
        </>
      ) : isSwitch && cases.length > 0 ? (
        cases.map((c, i) => (
          <Handle
            key={c}
            id={c}
            type="source"
            position={Position.Bottom}
            style={{ left: `${((i + 1) / (cases.length + 1)) * 100}%` }}
          />
        ))
      ) : (
        <Handle id="right" type="source" position={Position.Right} />
      )}
    </div>
  );
}
