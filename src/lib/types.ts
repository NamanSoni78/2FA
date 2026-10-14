import type { OtpAlgorithm, OtpEncoding, OtpType } from "./totp";

/** Full credential as stored in the browser (local mode). */
export interface StoredCredential {
  id: string;
  label: string;
  issuer: string | null;
  /** base32 secret (plaintext; only ever lives in the user's browser). */
  secret: string;
  type: OtpType;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number;
  counter: number;
  encoding: OtpEncoding;
  createdAt: string;
  updatedAt: string;
}

/** What the API returns for a credential — never includes the secret. */
export interface CredentialView {
  id: string;
  label: string;
  issuer: string | null;
  type: OtpType;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number;
  counter: number;
  encoding: OtpEncoding;
  createdAt: string;
  updatedAt: string;
  /** Current code (TOTP always; HOTP = code at the stored counter). */
  code?: string | null;
  /** Epoch ms when the TOTP code expires (null for HOTP). */
  expiresAt?: number | null;
}

/** Payload accepted by POST /api/credentials and PATCH /api/credentials/[id]. */
export interface CredentialInput {
  label: string;
  issuer: string | null;
  secret: string;
  type: OtpType;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number;
  counter: number;
  encoding: OtpEncoding;
}

export interface PublicUser {
  id: string;
  username: string;
  createdAt: string;
}

export interface ApiError {
  error: string;
}
