/**
 * Isomorphic TOTP / HOTP code generation (RFC 4226 & RFC 6238).
 *
 * Uses the Web Crypto API so the exact same code runs:
 *   - in the browser (local-mode credentials)
 *   - in Node.js route handlers (account-mode credentials, 18+ has globalThis.crypto)
 *
 * Supported: TOTP + HOTP, SHA-1 / SHA-256 / SHA-512, 5-8 digits,
 * custom periods, and Steam-style 5 character codes.
 */

export type OtpType = "totp" | "hotp";
export type OtpAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";
export type OtpEncoding = "base32" | "steam";

export const OTP_ALGORITHMS: OtpAlgorithm[] = ["SHA-1", "SHA-256", "SHA-512"];

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEAM_ALPHABET = "23456789BCDFGHJKMNPQRTVWXY";

/* ------------------------------------------------------------------ */
/* Secret helpers                                                      */
/* ------------------------------------------------------------------ */

/** Uppercase, strip whitespace / dashes / padding so secrets paste cleanly. */
export function normalizeSecret(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
}

export interface SecretValidation {
  ok: boolean;
  error?: string;
}

export function validateBase32Secret(input: string): SecretValidation {
  const s = normalizeSecret(input);
  if (!s) return { ok: false, error: "Secret key is empty." };
  if (/[^A-Z2-7]/.test(s)) {
    return {
      ok: false,
      error: "Setup keys only use letters A–Z and digits 2–7 (base32).",
    };
  }
  if (s.length < 8) {
    return { ok: false, error: "That secret looks too short to be valid." };
  }
  if (s.length > 1024) {
    return { ok: false, error: "That secret is unusually long." };
  }
  return { ok: true };
}

/** RFC 4648 base32 decode (leftover bits < 8 are discarded, as standard). */
export function base32Decode(input: string): Uint8Array {
  const clean = normalizeSecret(input);
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${clean[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/* ------------------------------------------------------------------ */
/* Code generation                                                     */
/* ------------------------------------------------------------------ */

async function hmacSign(
  algorithm: OtpAlgorithm,
  key: Uint8Array,
  message: Uint8Array,
): Promise<Uint8Array> {
  const subtle = globalThis.crypto.subtle;
  const cryptoKey = await subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: { name: algorithm } },
    false,
    ["sign"],
  );
  const signature = await subtle.sign("HMAC", cryptoKey, message as BufferSource);
  return new Uint8Array(signature);
}

export interface CodeParams {
  secret: string;
  type?: OtpType;
  algorithm?: OtpAlgorithm;
  digits?: number;
  period?: number;
  counter?: number;
  encoding?: OtpEncoding;
}

export interface GeneratedCode {
  code: string;
  /** Epoch ms when this code stops being valid (TOTP only; 0 for HOTP). */
  expiresAt: number;
}

/**
 * Generate a one-time code. `timestamp` is injectable for deterministic tests.
 */
export async function generateCode(
  params: CodeParams,
  timestamp: number = Date.now(),
): Promise<GeneratedCode> {
  const type = params.type ?? "totp";
  const algorithm = params.algorithm ?? "SHA-1";
  const digits = params.digits ?? 6;
  const period = Math.max(1, params.period ?? 30);
  const encoding = params.encoding ?? "base32";
  const now = timestamp;

  const key = base32Decode(params.secret);
  const counterValue =
    type === "hotp" ? params.counter ?? 0 : Math.floor(now / 1000 / period);

  // 8-byte big-endian counter block
  const message = new Uint8Array(8);
  let v = counterValue;
  for (let i = 7; i >= 0; i--) {
    message[i] = v & 0xff;
    v = Math.floor(v / 256);
  }

  const hmac = await hmacSign(algorithm, key, message);
  const expiresAt =
    type === "hotp" ? 0 : (Math.floor(now / 1000 / period) + 1) * period * 1000;

  if (encoding === "steam") {
    // Steam Guard: first 4 bytes big-endian, then 5 chars of a custom alphabet.
    let full =
      ((hmac[0] << 24) | (hmac[1] << 16) | (hmac[2] << 8) | hmac[3]) >>> 0;
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += STEAM_ALPHABET[full % 26];
      full = Math.floor(full / 26);
    }
    return { code, expiresAt };
  }

  // RFC 4226 dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    (((hmac[offset] & 0x7f) << 24) |
      (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) |
      hmac[offset + 3]) >>>
    0;
  const mod = 10 ** digits;
  return { code: String(bin % mod).padStart(digits, "0"), expiresAt };
}

/** How many full seconds remain until the current TOTP window ends. */
export function secondsRemaining(now: number, period: number): number {
  const p = Math.max(1, period);
  return Math.max(0, Math.ceil(((Math.floor(now / 1000 / p) + 1) * p * 1000 - now) / 1000));
}

/** "123456" -> "123 456", "12345678" -> "1234 5678" for display. */
export function splitCodeForDisplay(code: string): string {
  const len = code.length;
  if (len === 6 || len === 7) return `${code.slice(0, 3)} ${code.slice(3)}`;
  if (len === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}

/* ------------------------------------------------------------------ */
/* otpauth:// URI handling                                             */
/* ------------------------------------------------------------------ */

export function normalizeAlgorithm(input: unknown): OtpAlgorithm {
  if (typeof input !== "string") return "SHA-1";
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned === "SHA256") return "SHA-256";
  if (cleaned === "SHA512") return "SHA-512";
  return "SHA-1";
}

export interface ParsedOtpauth {
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

/** Parse an otpauth:// URI (the format encoded in service QR codes). */
export function parseOtpauthUri(uri: string): ParsedOtpauth | null {
  try {
  const trimmed = uri.trim();
    if (!/^otpauth:\/\//i.test(trimmed)) return null;
    const u = new URL(trimmed);
    const type: OtpType = (u.host || "").toLowerCase() === "hotp" ? "hotp" : "totp";

    let label = decodeURIComponent(u.pathname.replace(/^\/+/, "")).trim();
    let issuer = (u.searchParams.get("issuer") ?? "").trim();
    if (label.includes(":")) {
      const idx = label.indexOf(":");
      const labelIssuer = label.slice(0, idx).trim();
      label = label.slice(idx + 1).trim();
      if (!issuer) issuer = labelIssuer;
    }

    const secret = normalizeSecret(u.searchParams.get("secret") ?? "");
    const rawDigits = Number.parseInt(u.searchParams.get("digits") ?? "", 10);
    const rawPeriod = Number.parseInt(u.searchParams.get("period") ?? "", 10);
    const rawCounter = Number.parseInt(u.searchParams.get("counter") ?? "", 10);

    const steamByIssuer = issuer.toLowerCase() === "steam" && !u.searchParams.get("digits");

    return {
      label,
      issuer,
      secret,
      type,
      algorithm: normalizeAlgorithm(u.searchParams.get("algorithm")),
      digits: Number.isFinite(rawDigits) ? Math.min(Math.max(rawDigits, 5), 10) : steamByIssuer ? 5 : 6,
      period: Number.isFinite(rawPeriod) ? Math.min(Math.max(rawPeriod, 5), 3600) : 30,
      counter: Number.isFinite(rawCounter) ? Math.min(Math.max(rawCounter, 0), 2 ** 31) : 0,
      encoding: steamByIssuer ? "steam" : "base32",
    };
  } catch {
    return null;
  }
}

/** Build a standard otpauth:// URI (used for the QR export). */
export function buildOtpauthUri(c: {
  label: string;
  issuer?: string | null;
  secret: string;
  type: OtpType;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number;
  counter: number;
  encoding: OtpEncoding;
}): string {
  const issuer = (c.issuer ?? "").trim();
  const label = issuer ? `${issuer}:${c.label}` : c.label;
  const params = new URLSearchParams();
  params.set("secret", normalizeSecret(c.secret));
  if (issuer) params.set("issuer", issuer);
  if (c.algorithm !== "SHA-1") params.set("algorithm", c.algorithm.replace("-", ""));
  if (c.digits !== 6) params.set("digits", String(c.digits));
  if (c.type === "totp" && c.period !== 30) params.set("period", String(c.period));
  if (c.type === "hotp") params.set("counter", String(c.counter));
  return `otpauth://${c.type}/${encodeURIComponent(label)}?${params.toString()}`;
}
