"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  Workflow,
  TriggerType,
  AIModel,
  WorkflowAction,
} from "@/lib/types/workflow";

import { workflowTemplates, getTemplate } from "@/lib/data/templates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  onCreate: (workflow: Workflow) => void;

  editingWorkflow?: Workflow | null;
}

export default function CreateWorkflowDialog({
  open,
  onOpenChange,
  onCreate,
  editingWorkflow,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [trigger, setTrigger] =
    useState<TriggerType>("Telegram");

  const [aiModel, setAiModel] =
    useState<AIModel>("GPT-5.5");

  const [action, setAction] =
    useState<WorkflowAction>("Send Email");

  const [templateId, setTemplateId] = useState<string>("blank");

  useEffect(() => {
    if (editingWorkflow) {
      setTitle(editingWorkflow.title);
      setDescription(editingWorkflow.description);
      setTrigger(editingWorkflow.trigger);
      setAiModel(editingWorkflow.aiModel);
      setAction(editingWorkflow.action);
    } else {
      setTitle("");
      setDescription("");
      setTrigger("Telegram");
      setAiModel("GPT-5.5");
      setAction("Send Email");
      setTemplateId("blank");
    }
  }, [editingWorkflow, open]);

  function handleTemplateChange(id: string | null) {
    if (!id) return;
    setTemplateId(id);
    const template = getTemplate(id);
    if (!template) return;

    if (!title.trim()) setTitle(template.name);
    setDescription(template.description);
    setTrigger(template.trigger);
    setAiModel(template.aiModel);
    setAction(template.action);
  }

  function handleCreate() {
    if (!title.trim()) return;

    const template = getTemplate(templateId);

    onCreate({
      id: editingWorkflow?.id ?? crypto.randomUUID(),

      title,
      description,
      trigger,
      aiModel,
      action,

      status: editingWorkflow?.status ?? "Draft",

      nodes: template?.nodes,
      edges: template?.edges,
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingWorkflow ? "Edit Workflow" : "Create Workflow"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {!editingWorkflow && (
            <div className="space-y-2">
              <Label>Start from a template</Label>

              <Select
                value={templateId}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="blank">
                    Blank workflow
                  </SelectItem>

                  {workflowTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Workflow Name</Label>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="AI Lead Qualification"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>

            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your workflow..."
            />
          </div>

          <div className="space-y-2">
            <Label>Trigger</Label>

            <Select
              value={trigger}
              onValueChange={(value) =>
                setTrigger(value as TriggerType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Telegram">
                  Telegram
                </SelectItem>

                <SelectItem value="WhatsApp">
                  WhatsApp
                </SelectItem>

                <SelectItem value="Email">
                  Email
                </SelectItem>

                <SelectItem value="Webhook">
                  Webhook
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>AI Model</Label>

            <Select
              value={aiModel}
              onValueChange={(value) =>
                setAiModel(value as AIModel)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="GPT-5.5">
                  GPT-5.5
                </SelectItem>

                <SelectItem value="Gemini">
                  Gemini
                </SelectItem>

                <SelectItem value="Claude">
                  Claude
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Action</Label>

            <Select
              value={action}
              onValueChange={(value) =>
                setAction(value as WorkflowAction)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Send Email">
                  Send Email
                </SelectItem>

                <SelectItem value="Google Sheets">
                  Google Sheets
                </SelectItem>

                <SelectItem value="Slack">
                  Slack
                </SelectItem>

                <SelectItem value="Discord">
                  Discord
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              className="flex-1"
              onClick={handleCreate}
            >
              {editingWorkflow ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}