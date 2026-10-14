"use client";

import { useState } from "react";
import { ClipboardPaste, Loader2, Plus, ScanLine, KeyRound, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CredentialFields,
  emptyFormState,
  formFromParsed,
  validateForm,
  type CredentialFormState,
} from "@/components/vault/credential-fields";
import { QrScanner } from "@/components/vault/qr-scanner";
import { normalizeSecret, parseOtpauthUri, validateBase32Secret } from "@/lib/totp";
import type { CredentialInput } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Return true when saved successfully (the dialog then closes). */
  onSave: (input: CredentialInput) => Promise<boolean>;
}

export function AddCredentialDialog({ open, onOpenChange, onSave }: Props) {
  const [tab, setTab] = useState("key");
  const [state, setState] = useState<CredentialFormState>(emptyFormState);
  const [linkText, setLinkText] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setState(emptyFormState);
    setLinkText("");
    setTab("key");
    setBusy(false);
  }

  function patch(next: Partial<CredentialFormState>) {
    setState((s) => ({ ...s, ...next }));
  }

  function ingestText(text: string): boolean {
    const trimmed = text.trim();
    const parsed = parseOtpauthUri(trimmed);
    if (parsed && validateBase32Secret(parsed.secret).ok) {
      setState((s) => ({
        ...formFromParsed(parsed),
        label: parsed.label || s.label,
        issuer: parsed.issuer || s.issuer,
      }));
      setTab("key");
      toast.success("QR decoded", {
        description: "Check the details and press Add.",
      });
      return true;
    }
    // Bare secret inside a QR? Some services show just the key.
    const bare = normalizeSecret(trimmed);
    if (bare && validateBase32Secret(bare).ok) {
      patch({ secret: bare });
      setTab("key");
      toast.success("Secret captured", { description: "Add a name and press Add." });
      return true;
    }
    toast.error("Could not read that QR code", {
      description: "Try the setup key or paste the otpauth link instead.",
    });
    return false;
  }

  async function save() {
    const problem = validateForm(state, false);
    if (problem) {
      toast.error(problem);
      if (problem.toLowerCase().includes("name")) {
        setTab("key");
      }
      return;
    }
    setBusy(true);
    try {
      const ok = await onSave({
        label: state.label.trim(),
        issuer: state.issuer.trim() || null,
        secret: normalizeSecret(state.secret),
        type: state.type,
        algorithm: state.algorithm,
        digits: state.digits,
        period: state.period,
        counter: state.counter,
        encoding: state.encoding,
      });
      if (ok) {
        onOpenChange(false);
        reset();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="space-y-1.5 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="size-5 text-primary" />
            Add authenticator
          </DialogTitle>
          <DialogDescription>
            Paste the setup key your service gave you, scan its QR code, or drop
            in an otpauth link.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="gap-0">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="key" className="gap-1.5">
                <KeyRound className="size-3.5" />
                Setup key
              </TabsTrigger>
              <TabsTrigger value="scan" className="gap-1.5">
                <ScanLine className="size-3.5" />
                Scan QR
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-1.5">
                <Link2 className="size-3.5" />
                Paste link
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="scroll-slim max-h-[62dvh] overflow-y-auto px-6 py-5">
            <TabsContent value="key" className="m-0">
              <CredentialFields state={state} onChange={patch} idPrefix="add" />
            </TabsContent>

            <TabsContent value="scan" className="m-0">
              <QrScanner onResult={ingestText} />
            </TabsContent>

            <TabsContent value="link" className="m-0 space-y-3">
              <Textarea
                placeholder="otpauth://totp/GitHub:you?secret=JBSWY3DPEHPK3PXP&issuer=GitHub"
                className="min-h-28 resize-none font-mono text-xs"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                aria-label="otpauth link"
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                onClick={() => ingestText(linkText)}
                disabled={!linkText.trim()}
              >
                <ClipboardPaste className="size-4" />
                Parse link
              </Button>
              <p className="text-xs text-muted-foreground">
                The link format is what services encode into their QR codes —
                you&apos;ll find it in “can&apos;t scan” dialogs.
              </p>
            </TabsContent>
          </div>
        </Tabs>

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
              <Plus className="size-4" />
            )}
            Add authenticator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
