import {
  OTP_ALGORITHMS,
  normalizeSecret,
  validateBase32Secret,
  type OtpAlgorithm,
  type OtpEncoding,
  type OtpType,
} from "./totp";
import type { CredentialInput } from "./types";

/**
 * Hand-rolled validation — deliberately dependency-free so the serverless
 * bundle stays tiny. Every validator returns { ok, error } with a message
 * that is safe (and friendly) to show directly in the UI.
 */

export interface ValidationResult<T = unknown> {
  ok: boolean;
  error?: string;
  value?: T;
}

export function validateUsername(input: unknown): ValidationResult<string> {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false, error: "Username is required." };
  }
  const v = input.trim();
  if (v.length < 3 || v.length > 30) {
    return { ok: false, error: "Username must be 3–30 characters." };
  }
  if (!/^[a-zA-Z0-9_.]+$/.test(v)) {
    return {
      ok: false,
      error: "Username can only contain letters, numbers, dots and underscores.",
    };
  }
  if (/^[._]|[._]$/.test(v)) {
    return { ok: false, error: "Username cannot start or end with a dot or underscore." };
  }
  return { ok: true, value: v };
}

export function validatePassword(input: unknown): ValidationResult<string> {
  if (typeof input !== "string" || !input) {
    return { ok: false, error: "Password is required." };
  }
  if (input.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (input.length > 200) {
    return { ok: false, error: "Password must be at most 200 characters." };
  }
  if (!/[a-zA-Z]/.test(input) || !/[0-9]/.test(input)) {
    return { ok: false, error: "Password needs at least one letter and one number." };
  }
  return { ok: true, value: input };
}

function intIn(input: unknown, min: number, max: number): number | null {
  const n =
    typeof input === "number"
      ? input
      : typeof input === "string"
        ? Number.parseInt(input, 10)
        : NaN;
  if (!Number.isFinite(n) || Math.floor(n) !== n) return null;
  if (n < min || n > max) return null;
  return n;
}

export function validateCredentialInput(
  body: unknown,
): ValidationResult<CredentialInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;

  const label =
    typeof b.label === "string" ? b.label.trim() : "";
  if (!label) return { ok: false, error: "Give this authenticator a name." };
  if (label.length > 60) {
    return { ok: false, error: "Name must be at most 60 characters." };
  }

  let issuer: string | null = null;
  if (b.issuer !== undefined && b.issuer !== null) {
    if (typeof b.issuer !== "string") {
      return { ok: false, error: "Invalid issuer." };
    }
    issuer = b.issuer.trim().slice(0, 60) || null;
  }

  if (typeof b.secret !== "string") {
    return { ok: false, error: "Secret key is required." };
  }
  const secret = normalizeSecret(b.secret);
  const secretCheck = validateBase32Secret(secret);
  if (!secretCheck.ok) return { ok: false, error: secretCheck.error };

  const type: OtpType = b.type === "hotp" ? "hotp" : "totp";

  let algorithm: OtpAlgorithm = "SHA-1";
  if (b.algorithm !== undefined) {
    if (
      typeof b.algorithm === "string" &&
      (OTP_ALGORITHMS as string[]).includes(b.algorithm)
    ) {
      algorithm = b.algorithm as OtpAlgorithm;
    } else {
      return { ok: false, error: "Unsupported algorithm." };
    }
  }

  const encoding: OtpEncoding =
    b.encoding === "steam" ? "steam" : "base32";

  const digits = intIn(b.digits ?? 6, 5, 10);
  if (digits === null) return { ok: false, error: "Digits must be 5–10." };

  const period = intIn(b.period ?? 30, 5, 3600);
  if (period === null) return { ok: false, error: "Period must be 5–3600 seconds." };

  const counter = intIn(b.counter ?? 0, 0, 2 ** 31);
  if (counter === null) return { ok: false, error: "Invalid HOTP counter." };

  return {
    ok: true,
    value: { label, issuer, secret, type, algorithm, digits, period, counter, encoding },
  };
}

/** Partial update validation (PATCH): only validates fields that are present. */
export function validateCredentialPatch(
  body: unknown,
): ValidationResult<Partial<CredentialInput>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;
  const patch: Partial<CredentialInput> = {};

  if (b.label !== undefined) {
    const label = typeof b.label === "string" ? b.label.trim() : "";
    if (!label) return { ok: false, error: "Name cannot be empty." };
    if (label.length > 60) {
      return { ok: false, error: "Name must be at most 60 characters." };
    }
    patch.label = label;
  }

  if (b.issuer !== undefined) {
    if (b.issuer !== null && typeof b.issuer !== "string") {
      return { ok: false, error: "Invalid issuer." };
    }
    patch.issuer =
      typeof b.issuer === "string" ? b.issuer.trim().slice(0, 60) || null : null;
  }

  if (b.secret !== undefined) {
    if (typeof b.secret !== "string" || !b.secret.trim()) {
      // An empty string never means "clear the secret" — treat as absent.
      delete patch.secret;
    } else {
      const secret = normalizeSecret(b.secret);
      const check = validateBase32Secret(secret);
      if (!check.ok) return { ok: false, error: check.error };
      patch.secret = secret;
    }
  }

  if (b.type !== undefined) {
    if (b.type !== "totp" && b.type !== "hotp") {
      return { ok: false, error: "Type must be totp or hotp." };
    }
    patch.type = b.type;
  }

  if (b.algorithm !== undefined) {
    if (
      typeof b.algorithm !== "string" ||
      !(OTP_ALGORITHMS as string[]).includes(b.algorithm)
    ) {
      return { ok: false, error: "Unsupported algorithm." };
    }
    patch.algorithm = b.algorithm as OtpAlgorithm;
  }

  if (b.digits !== undefined) {
    const digits = intIn(b.digits, 5, 10);
    if (digits === null) return { ok: false, error: "Digits must be 5–10." };
    patch.digits = digits;
  }

  if (b.period !== undefined) {
    const period = intIn(b.period, 5, 3600);
    if (period === null) return { ok: false, error: "Period must be 5–3600 seconds." };
    patch.period = period;
  }

  if (b.counter !== undefined) {
    const counter = intIn(b.counter, 0, 2 ** 31);
    if (counter === null) return { ok: false, error: "Invalid HOTP counter." };
    patch.counter = counter;
  }

  if (b.encoding !== undefined) {
    if (b.encoding !== "base32" && b.encoding !== "steam") {
      return { ok: false, error: "Invalid encoding." };
    }
    patch.encoding = b.encoding;
  }

  if (!Object.keys(patch).length) {
    return { ok: false, error: "Nothing to update." };
  }
  return { ok: true, value: patch };
}

/** Parse + validate a JSON array of credentials for bulk import. */
export function validateImportArray(
  body: unknown,
): ValidationResult<Array<{ id: string; input: CredentialInput }>> {
  const list = Array.isArray(body) ? body : [];
  if (!list.length) return { ok: false, error: "No credentials found in the file." };
  if (list.length > 100) {
    return { ok: false, error: "Import at most 100 credentials at a time." };
  }
  const out: Array<{ id: string; input: CredentialInput }> = [];
  const seen = new Set<string>();
  for (const item of list) {
    const check = validateCredentialInput(item);
    if (!check.ok) continue;
    const key = `${check.value!.label}|${check.value!.secret}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: globalThis.crypto.randomUUID(),
      input: check.value!,
    });
  }
  if (!out.length) {
    return { ok: false, error: "None of the entries in the file were valid." };
  }
  return { ok: true, value: out };
}
