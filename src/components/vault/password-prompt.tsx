"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Return an error message, or null on success. */
  onConfirm: (password: string) => Promise<string | null>;
}

/** Generic password re-confirmation dialog (export, sensitive actions). */
export function PasswordPromptDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Continue",
  onConfirm,
}: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setPassword("");
    setError(null);
    setBusy(false);
  }

  function handleOpenChange(next: boolean) {
    if (busy && !next) return; // block closing mid-request
    if (!next) reset();
    onOpenChange(next);
  }

  async function confirm() {
    if (busy) return;
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    setError(null);
    const problem = await onConfirm(password);
    setBusy(false);
    if (problem) {
      setError(problem);
    } else {
      reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="prompt-password">Account password</Label>
          <Input
            id="prompt-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void confirm();
              }
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void confirm()}
            disabled={busy}
            className="gap-1.5 font-semibold"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
