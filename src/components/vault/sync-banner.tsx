"use client";

import { CloudUpload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  count: number;
  busy: boolean;
  onUpload: () => void;
  onDismiss: () => void;
}

/** Shown when a signed-in user still has credentials saved locally. */
export function SyncBanner({ count, busy, onUpload, onDismiss }: Props) {
  return (
    <Card className="animate-fade-up border-primary/35 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CloudUpload className="size-4" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {count} credential{count === 1 ? "" : "s"} saved only in this browser
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upload {count === 1 ? "it" : "them"} to your account so {count === 1 ? "it" : "they"}{" "}
              survive a cleared cache and follow you to other devices.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <Button
            size="sm"
            onClick={onUpload}
            disabled={busy}
            className="h-9 gap-1.5 rounded-full font-semibold"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CloudUpload className="size-3.5" />
            )}
            Upload to account
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDismiss}
            aria-label="Dismiss"
            title="Keep them local — dismiss"
            className="size-9 rounded-full text-muted-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
