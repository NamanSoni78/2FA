"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Settings2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CountdownRing } from "@/components/vault/countdown-ring";
import {
  generateCode,
  normalizeSecret,
  splitCodeForDisplay,
  validateBase32Secret,
  type OtpAlgorithm,
  type OtpEncoding,
  type OtpType,
} from "@/lib/totp";
import { cn } from "@/lib/utils";

export interface CredentialFormState {
  label: string;
  issuer: string;
  secret: string;
  type: OtpType;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number;
  counter: number;
  encoding: OtpEncoding;
}

export const emptyFormState: CredentialFormState = {
  label: "",
  issuer: "",
  secret: "",
  type: "totp",
  algorithm: "SHA-1",
  digits: 6,
  period: 30,
  counter: 0,
  encoding: "base32",
};

export function formFromParsed(parsed: {
  label: string;
  issuer: string;
  secret: string;
  type: OtpType;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number;
  counter: number;
  encoding: OtpEncoding;
}): CredentialFormState {
  return {
    label: parsed.label.slice(0, 60),
    issuer: parsed.issuer.slice(0, 60),
    secret: parsed.secret,
    type: parsed.type,
    algorithm: parsed.algorithm,
    digits: parsed.digits,
    period: parsed.period,
    counter: parsed.counter,
    encoding: parsed.encoding,
  };
}

/** Live rotating preview of the code the entered secret would produce. */
function LivePreview({ state }: { state: CredentialFormState }) {
  const [preview, setPreview] = useState<{ code: string; expiresAt: number } | null>(null);
  const [computing, setComputing] = useState(false);
  const [now, setNow] = useState(Date.now());

  const secret = normalizeSecret(state.secret);
  const valid = secret.length > 0 && validateBase32Secret(secret).ok;

  useEffect(() => {
    if (!valid) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setComputing(true);
    const t = setTimeout(async () => {
      try {
        const g = await generateCode({
          secret,
          type: state.type,
          algorithm: state.algorithm,
          digits: state.encoding === "steam" ? 5 : state.digits,
          period: state.period,
          counter: state.counter,
          encoding: state.encoding,
        });
        if (!cancelled) setPreview({ code: g.code, expiresAt: g.expiresAt });
      } finally {
        if (!cancelled) setComputing(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    valid,
    secret,
    state.type,
    state.algorithm,
    state.digits,
    state.period,
    state.counter,
    state.encoding,
  ]);

  useEffect(() => {
    if (!preview || state.type !== "totp") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [preview, state.type]);

  if (!valid) return null;

  const remaining = preview
    ? Math.max(0, Math.ceil((preview.expiresAt - now) / 1000))
    : 0;

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3"
      aria-live="off"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </p>
        <p className="code-digits mt-0.5 font-mono text-2xl font-semibold leading-none">
          {computing || !preview ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            splitCodeForDisplay(preview.code)
          )}
        </p>
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
          Should match what your service shows right now.
        </p>
      </div>
      {preview && state.type === "totp" && (
        <CountdownRing remaining={remaining} period={state.period} />
      )}
    </div>
  );
}

interface FieldsProps {
  state: CredentialFormState;
  onChange: (patch: Partial<CredentialFormState>) => void;
  idPrefix: string;
  /** When true an empty secret is acceptable (edit dialog: blank = keep). */
  secretOptional?: boolean;
}

export function CredentialFields({ state, onChange, idPrefix, secretOptional }: FieldsProps) {
  const secretRaw = state.secret.trim();
  const secretCheck = secretRaw
    ? validateBase32Secret(secretRaw)
    : { ok: secretOptional === true, error: undefined };

  const steam = state.encoding === "steam";
  const advancedOpen =
    state.type !== "totp" ||
    state.algorithm !== "SHA-1" ||
    state.digits !== 6 ||
    state.period !== 30 ||
    steam ||
    state.counter !== 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-secret`}>
          Secret setup key{" "}
          {secretOptional && (
            <span className="font-normal text-muted-foreground">
              (leave blank to keep current)
            </span>
          )}
        </Label>
        <Input
          id={`${idPrefix}-secret`}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "px-3 py-2.5 font-mono text-sm tracking-wide",
            secretRaw && !secretCheck.ok && "border-destructive/60 focus-visible:ring-destructive/40",
            secretRaw && secretCheck.ok && "border-primary/50",
          )}
          placeholder="e.g. JBSW Y3DP EHPK 3PXP"
          value={state.secret}
          onChange={(e) => onChange({ secret: e.target.value })}
        />
        <div className="flex min-h-4 items-center gap-1.5 text-xs">
          {secretRaw && secretCheck.ok && (
            <>
              <CheckCircle2 className="size-3.5 text-primary" />
              <span className="text-primary">Valid base32 key</span>
            </>
          )}
          {secretRaw && !secretCheck.ok && (
            <>
              <XCircle className="size-3.5 text-destructive" />
              <span className="text-destructive">{secretCheck.error}</span>
            </>
          )}
        </div>
      </div>

      <LivePreview state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-label`}>
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-label`}
            placeholder="e.g. GitHub, email, bank…"
            maxLength={60}
            value={state.label}
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-issuer`}>
            Service <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={`${idPrefix}-issuer`}
            placeholder="e.g. GitHub"
            maxLength={60}
            value={state.issuer}
            onChange={(e) => onChange({ issuer: e.target.value })}
          />
        </div>
      </div>

      <Collapsible defaultOpen={advancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="size-4" />
            Advanced settings
            {advancedOpen && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                customized
              </span>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-type`}>Type</Label>
              <Select
                value={state.type}
                onValueChange={(v) => onChange({ type: v as OtpType })}
              >
                <SelectTrigger id={`${idPrefix}-type`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totp">TOTP (timed)</SelectItem>
                  <SelectItem value="hotp">HOTP (counter)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-algorithm`}>Algorithm</Label>
              <Select
                value={state.algorithm}
                onValueChange={(v) => onChange({ algorithm: v as OtpAlgorithm })}
              >
                <SelectTrigger id={`${idPrefix}-algorithm`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHA-1">SHA-1</SelectItem>
                  <SelectItem value="SHA-256">SHA-256</SelectItem>
                  <SelectItem value="SHA-512">SHA-512</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-digits`}>Digits</Label>
              <Select
                value={String(state.digits)}
                onValueChange={(v) => onChange({ digits: Number(v) })}
                disabled={steam}
              >
                <SelectTrigger id={`${idPrefix}-digits`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[6, 7, 8].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-period`}>
                {state.type === "totp" ? "Refresh" : "—"}
              </Label>
              {state.type === "totp" ? (
                <Select
                  value={String(state.period)}
                  onValueChange={(v) => onChange({ period: Number(v) })}
                >
                  <SelectTrigger id={`${idPrefix}-period`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 60].map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input
                    id={`${idPrefix}-counter`}
                    type="number"
                    min={0}
                    value={state.counter}
                    onChange={(e) =>
                      onChange({ counter: Math.max(0, Number(e.target.value) || 0) })
                    }
                    aria-label="HOTP counter"
                  />
                </div>
              )}
            </div>
          </div>

          <label
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3"
            htmlFor={`${idPrefix}-steam`}
          >
            <span className="text-sm">
              Steam-style code
              <span className="mt-0.5 block text-xs text-muted-foreground">
                5-character codes used by Steam Guard
              </span>
            </span>
            <Switch
              id={`${idPrefix}-steam`}
              checked={steam}
              onCheckedChange={(checked) =>
                onChange(
                  checked
                    ? { encoding: "steam", digits: 5 }
                    : { encoding: "base32", digits: 6 },
                )
              }
            />
          </label>

          {state.type === "hotp" && (
            <p className="text-xs text-muted-foreground">
              HOTP codes advance only when you tap “Next” — matching how
              counter-based services expect to be used.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/** Validates the full form; returns an error message or null. */
export function validateForm(
  state: CredentialFormState,
  secretOptional: boolean,
): string | null {
  if (!state.label.trim()) return "Give this authenticator a name.";
  if (state.label.trim().length > 60) return "Name must be at most 60 characters.";
  const secret = normalizeSecret(state.secret);
  if (!secret && secretOptional) return null;
  const check = validateBase32Secret(secret);
  if (!check.ok) return check.error ?? "Invalid secret key.";
  return null;
}
