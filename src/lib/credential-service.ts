import { NextResponse } from "next/server";
import type { CredentialRow } from "./db";
import { decryptSecret } from "./db";
import { generateCode } from "./totp";
import type { CredentialView } from "./types";

/** Shared logic for the credential API routes. */

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function rowToView(row: CredentialRow, code?: string | null, expiresAt?: number | null): CredentialView {
  return {
    id: row.id,
    label: row.label,
    issuer: row.issuer,
    type: row.type,
    algorithm: row.algorithm,
    digits: row.digits,
    period: row.period,
    counter: row.counter,
    encoding: row.encoding,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    code: code ?? null,
    expiresAt: expiresAt ?? null,
  };
}

/** Decrypts each row and computes its current live code. */
export async function rowsToViews(rows: CredentialRow[]): Promise<CredentialView[]> {
  return Promise.all(
    rows.map(async (row) => {
      try {
        const secret = decryptSecret(row.secret_enc);
        const generated = await generateCode(
          {
            secret,
            type: row.type,
            algorithm: row.algorithm,
            digits: row.digits,
            period: row.period,
            counter: row.counter,
            encoding: row.encoding,
          },
        );
        return rowToView(row, generated.code, generated.expiresAt || null);
      } catch {
        // A single undecryptable row should not take down the whole list.
        return rowToView(row, null, null);
      }
    }),
  );
}

export async function computeCode(row: CredentialRow): Promise<{ code: string; expiresAt: number }> {
  const secret = decryptSecret(row.secret_enc);
  return generateCode({
    secret,
    type: row.type,
    algorithm: row.algorithm,
    digits: row.digits,
    period: row.period,
    counter: row.counter,
    encoding: row.encoding,
  });
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function handleServerError(e: unknown): NextResponse {
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes("DATABASE_URL")) {
    return jsonError(
      "Database is not configured. Set DATABASE_URL to your Neon pooled connection string.",
      503,
    );
  }
  if (message.includes("ENCRYPTION_KEY") || message.includes("SESSION_SECRET")) {
    return jsonError(message, 500);
  }
  console.error("[api]", e);
  return jsonError("Something went wrong on our side. Please try again.", 500);
}
