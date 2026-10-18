"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import {
  getApiKeys,
  upsertApiKey,
  deleteApiKey,
  maskKey,
} from "@/lib/actions/apiKeys";
import type { ApiKeyProvider, UserApiKey } from "@/lib/types/workflow";

const PROVIDERS: { id: ApiKeyProvider; label: string; placeholder: string }[] = [
  { id: "openai", label: "OpenAI (GPT-5.5)", placeholder: "sk-..." },
  { id: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-..." },
  { id: "gemini", label: "Google (Gemini)", placeholder: "AIza..." },
  { id: "slack", label: "Slack", placeholder: "xoxb-..." },
  { id: "telegram", label: "Telegram Bot", placeholder: "123456:ABC-..." },
];

export default function ApiKeysForm() {
  const [keys, setKeys] = useState<UserApiKey[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  async function load() {
    const data = await getApiKeys();
    setKeys(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(provider: ApiKeyProvider) {
    const value = drafts[provider]?.trim();
    if (!value) return;

    setSavingProvider(provider);
    try {
      await upsertApiKey(provider, value);
      setDrafts((prev) => ({ ...prev, [provider]: "" }));
      await load();
      toast.success("API key saved.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save API key.");
    } finally {
      setSavingProvider(null);
    }
  }

  async function handleDelete(provider: ApiKeyProvider) {
    try {
      await deleteApiKey(provider);
      await load();
      toast.success("API key removed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove API key.");
    }
  }

  return (
    <div className="space-y-4">
      {PROVIDERS.map((provider) => {
        const existing = keys.find((k) => k.provider === provider.id);

        return (
          <Card key={provider.id}>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-muted p-2.5">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{provider.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {existing ? maskKey(existing.key_value) : "Not configured — nodes will simulate"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder={provider.placeholder}
                  value={drafts[provider.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [provider.id]: e.target.value }))
                  }
                  className="w-56"
                />
                <Button
                  size="sm"
                  onClick={() => handleSave(provider.id)}
                  disabled={savingProvider === provider.id}
                >
                  {existing ? "Update" : "Save"}
                </Button>
                {existing && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
