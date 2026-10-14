import type { CredentialView, StoredCredential } from "@/lib/types";

/**
 * Unified shape the UI renders — merges locally stored credentials and
 * server-synced ones, each carrying its current live code.
 */
export interface DisplayCredential {
  id: string;
  label: string;
  issuer: string | null;
  type: "totp" | "hotp";
  algorithm: "SHA-1" | "SHA-256" | "SHA-512";
  digits: number;
  period: number;
  counter: number;
  encoding: "base32" | "steam";
  createdAt: string;
  updatedAt: string;
  source: "local" | "server";
  code: string | null;
  expiresAt: number | null;
}

export function storedToDisplay(c: StoredCredential): DisplayCredential {
  return {
    id: c.id,
    label: c.label,
    issuer: c.issuer,
    type: c.type,
    algorithm: c.algorithm,
    digits: c.digits,
    period: c.period,
    counter: c.counter,
    encoding: c.encoding,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    source: "local",
    code: null,
    expiresAt: null,
  };
}

export function viewToDisplay(c: CredentialView): DisplayCredential {
  return {
    id: c.id,
    label: c.label,
    issuer: c.issuer,
    type: c.type,
    algorithm: c.algorithm,
    digits: c.digits,
    period: c.period,
    counter: c.counter,
    encoding: c.encoding,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    source: "server",
    code: c.code ?? null,
    expiresAt: c.expiresAt ?? null,
  };
}

/** Fields needed to build an otpauth:// URI / QR for a credential. */
export interface SecretBearer {
  item: DisplayCredential;
  secret: string;
}
