import type { StoredCredential } from "./types";
import { normalizeSecret, type OtpAlgorithm, type OtpEncoding, type OtpType } from "./totp";

/**
 * Local-mode storage: credentials saved directly in the user's browser
 * (localStorage). They never touch our servers.
 *
 * Also used to remember that the user dismissed the "upload to account"
 * banner, and to cache the last known username (convenience only).
 */

const KEY = "n2fa.local.credentials.v1";

function sanitize(raw: unknown): StoredCredential | null {
  if (typeof raw !== "object" || raw === null) return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.id !== "string" || !c.id) return null;
  if (typeof c.label !== "string" || !c.label.trim()) return null;
  const secret = typeof c.secret === "string" ? normalizeSecret(c.secret) : "";
  if (!secret) return null;
  const type: OtpType = c.type === "hotp" ? "hotp" : "totp";
  const algorithm = (
    ["SHA-1", "SHA-256", "SHA-512"] as OtpAlgorithm[]
  ).includes(c.algorithm as OtpAlgorithm)
    ? (c.algorithm as OtpAlgorithm)
    : "SHA-1";
  const digits = Number.isFinite(Number(c.digits))
    ? Math.min(Math.max(Number(c.digits), 5), 10)
    : 6;
  const period = Number.isFinite(Number(c.period))
    ? Math.min(Math.max(Number(c.period), 5), 3600)
    : 30;
  const counter = Number.isFinite(Number(c.counter))
    ? Math.min(Math.max(Number(c.counter), 0), 2 ** 31)
    : 0;
  const encoding: OtpEncoding = c.encoding === "steam" ? "steam" : "base32";
  return {
    id: c.id,
    label: c.label.trim().slice(0, 60),
    issuer: typeof c.issuer === "string" && c.issuer.trim() ? c.issuer.trim().slice(0, 60) : null,
    secret,
    type,
    algorithm,
    digits,
    period,
    counter,
    encoding,
    createdAt: typeof c.createdAt === "string" ? c.createdAt : new Date().toISOString(),
    updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : new Date().toISOString(),
  };
}

export function loadLocalCredentials(): StoredCredential[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitize)
      .filter((c): c is StoredCredential => c !== null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export function saveLocalCredentials(list: StoredCredential[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full / private mode — surface via UI toast by callers if needed.
  }
}

export function clearLocalCredentials(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------- small preferences ------------------------- */

export function getDismissedSyncBanner(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("n2fa.syncBannerDismissed") === "1";
  } catch {
    return false;
  }
}

export function setDismissedSyncBanner(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("n2fa.syncBannerDismissed", "1");
  } catch {
    /* ignore */
  }
}
