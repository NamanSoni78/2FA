"use client";

import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Loader2, QrCode, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, apiError } from "@/lib/client-api";
import { buildOtpauthUri, normalizeSecret } from "@/lib/totp";
import type { DisplayCredential } from "@/components/vault/vault-types";

interface Props {
  item: DisplayCredential | null;
  localSecret?: string | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shows the credential's QR code + plaintext secret. For account-synced
 * credentials the secret is gated behind a password re-confirmation — it is
 * otherwise never sent back to the browser.
 */
export function SecretDialog({ item, localSecret, onOpenChange }: Props) {
  const open = item !== null;
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const serverItem = item?.source === "server";

  useEffect(() => {
    if (!item) {
      setPassword("");
      setSecret(null);
      setError(null);
      setShowSecret(false);
      setQrDataUrl(null);
      return;
    }
    if (!serverItem) {
      setSecret(localSecret ?? null);
    } else {
      setSecret(null);
    }
  }, [item]);

  useEffect(() => {
    if (!item || !secret) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const uri = buildOtpauthUri({
          label: item.label,
          issuer: item.issuer,
          secret,
          type: item.type,
          algorithm: item.algorithm,
          digits: item.digits,
          period: item.period,
          counter: item.counter,
          encoding: item.encoding,
        });
        const url = await QRCode.toDataURL(uri, {
          margin: 1,
          width: 232,
          errorCorrectionLevel: "M",
          color: { dark: "#0b1512", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        /* QR render failure is non-fatal — secret still shown */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item, secret]);

  const otpauth = item && secret
    ? buildOtpauthUri({
        label: item.label,
        issuer: item.issuer,
        secret,
        type: item.type,
        algorithm: item.algorithm,
        digits: item.digits,
        period: item.period,
        counter: item.counter,
        encoding: item.encoding,
      })
    : null;

  async function confirm() {
    if (!item || busy) return;
    if (!password) {
      setError("Enter your account password.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await api<{ secret: string }>(
      `/api/credentials/${encodeURIComponent(item.id)}/reveal`,
      { method: "POST", body: JSON.stringify({ password }) },
    );
    setBusy(false);
    if (!res.ok) {
      setError(apiError(res.data, "Could not reveal the secret."));
      return;
    }
    setSecret((res.data as { secret: string }).secret);
    setPassword("");
  }

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${what} copied to clipboard`);
    } catch {
      toast.error("Clipboard unavailable — select the text manually.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="space-y-1.5 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <QrCode className="size-5 text-primary" />
            {item?.label ?? "Credential"}
          </DialogTitle>
          <DialogDescription>
            {serverItem && !secret
              ? "Confirm your password to reveal the secret and QR code."
              : "Move this credential to any authenticator app by scanning the QR."}
          </DialogDescription>
        </DialogHeader>

        {serverItem && !secret ? (
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="reveal-password">Account password</Label>
              <Input
                id="reveal-password"
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
            <Button
              type="button"
              onClick={() => void confirm()}
              disabled={busy}
              className="h-11 w-full gap-2 font-semibold"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Reveal secret
            </Button>
          </div>
        ) : (
          <div className="space-y-5 px-6 pb-6">
            {qrDataUrl ? (
              <div className="flex justify-center">
                <img
                  src={qrDataUrl}
                  alt={`QR code to transfer ${item?.label ?? "this credential"} to another authenticator`}
                  className="size-56 rounded-xl border-4 border-white bg-white shadow-sm dark:border-white"
                  width={232}
                  height={232}
                />
              </div>
            ) : (
              <div className="flex size-56 items-center justify-center rounded-xl border border-border bg-muted/40">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {secret && (
              <div className="space-y-2">
                <Label htmlFor="revealed-secret">Secret key</Label>
                <div className="flex items-center gap-2">
                  <code className="scroll-slim flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-muted/50 px-3 py-2.5 font-mono text-sm">
                    {showSecret ? normalizeSecret(secret) : "•".repeat(Math.min(32, normalizeSecret(secret).length))}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSecret((v) => !v)}
                    aria-label={showSecret ? "Hide secret" : "Show secret"}
                    className="size-10 shrink-0"
                  >
                    {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void copy(normalizeSecret(secret), "Secret key")}
                    aria-label="Copy secret key"
                    className="size-10 shrink-0"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {otpauth && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => void copy(otpauth, "otpauth link")}
              >
                <LinkIcon />
                Copy otpauth:// link
              </Button>
            )}

            <Alert>
              <ShieldAlert className="size-4" />
              <AlertDescription>
                Treat this key like a password. Anyone who has it can generate
                your codes.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
