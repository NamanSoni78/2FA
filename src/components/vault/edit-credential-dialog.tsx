"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CredentialFields,
  validateForm,
  type CredentialFormState,
} from "@/components/vault/credential-fields";
import { normalizeSecret } from "@/lib/totp";
import type { CredentialInput } from "@/lib/types";
import type { DisplayCredential } from "@/components/vault/vault-types";

interface Props {
  item: DisplayCredential | null;
  initialSecret?: string | null;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    patch: Partial<CredentialInput>,
    source: "local" | "server",
  ) => Promise<boolean>;
}

function stateFromItem(item: DisplayCredential, secret: string): CredentialFormState {
  return {
    label: item.label,
    issuer: item.issuer ?? "",
    secret,
    type: item.type,
    algorithm: item.algorithm,
    digits: item.digits,
    period: item.period,
    counter: item.counter,
    encoding: item.encoding,
  };
}

export function EditCredentialDialog({
  item,
  initialSecret,
  onOpenChange,
  onSave,
}: Props) {
  const [state, setState] = useState<CredentialFormState>({
    label: "",
    issuer: "",
    secret: "",
    type: "totp",
    algorithm: "SHA-1",
    digits: 6,
    period: 30,
    counter: 0,
    encoding: "base32",
  });
  const [busy, setBusy] = useState(false);

  const open = item !== null;
  const serverItem = item?.source === "server";

  useEffect(() => {
    if (item) {
      setState(stateFromItem(item, initialSecret ?? ""));
    }
  }, [item, initialSecret]);

  function patch(next: Partial<CredentialFormState>) {
    setState((s) => ({ ...s, ...next }));
  }

  async function save() {
    if (!item) return;
    const problem = validateForm(state, serverItem);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      const secretProvided = state.secret.trim().length > 0;
      const ok = await onSave(
        item.id,
        {
          label: state.label.trim(),
          issuer: state.issuer.trim() || null,
          ...(secretProvided || !serverItem
            ? { secret: normalizeSecret(state.secret) }
            : {}),
          type: state.type,
          algorithm: state.algorithm,
          digits: state.digits,
          period: state.period,
          counter: state.counter,
          encoding: state.encoding,
        },
        item.source,
      );
      if (ok) onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="space-y-1.5 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="size-5 text-primary" />
            Edit authenticator
          </DialogTitle>
          <DialogDescription>
            Rename it, fix the details, or replace the secret key.
          </DialogDescription>
        </DialogHeader>

        <div className="scroll-slim max-h-[62dvh] overflow-y-auto px-6 py-5">
          <CredentialFields
            state={state}
            onChange={patch}
            idPrefix="edit"
            secretOptional={serverItem}
          />
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="min-w-28 gap-1.5 font-semibold shadow-sm transition-transform hover:-translate-y-px active:scale-[0.99]"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Pencil className="size-4" />
            )}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
