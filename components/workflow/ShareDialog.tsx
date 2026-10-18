"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getOrCreateShare, revokeShare } from "@/lib/actions/shares";

interface Props {
  workflowId: string;
}

export default function ShareDialog({ workflowId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    try {
      const share = await getOrCreateShare(workflowId);
      setUrl(`${window.location.origin}/share/${share.token}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create share link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    try {
      await revokeShare(workflowId);
      setUrl(null);
      toast.success("Share link revoked.");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to revoke share link.");
    }
  }

  function handleCopy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share this workflow</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Anyone with this link can view a read-only copy of your workflow canvas.
            They won&apos;t be able to edit or run it.
          </p>

          {loading ? (
            <p className="text-sm text-muted-foreground">Generating link...</p>
          ) : url ? (
            <div className="flex gap-2">
              <Input value={url} readOnly />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="destructive" onClick={handleRevoke} disabled={!url}>
              Revoke Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
