import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getDb, decryptSecret } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto.server";
import { rateLimit } from "@/lib/rate-limit";
import { handleServerError, jsonError } from "@/lib/credential-service";

export const runtime = "nodejs";

/**
 * POST /api/credentials/export — returns every credential WITH its plaintext
 * secret, gated behind password re-confirmation. Used by the JSON backup
 * export feature.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in first.", 401);

    const rl = rateLimit(`export:${userId}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return jsonError(`Too many attempts. Retry in ${rl.retryAfterSeconds}s.`, 429);
    }

    const body = (await request.json().catch(() => null)) as
      | { password?: string }
      | null;
    if (!body || typeof body.password !== "string") {
      return jsonError("Password confirmation is required.", 400);
    }

    const db = getDb();
    const user = await db.getUserById(userId);
    if (!user) return jsonError("Account not found.", 404);

    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) return jsonError("Incorrect password.", 403);

    const rows = await db.listCredentials(userId);
    const credentials = rows.map((row) => ({
      label: row.label,
      issuer: row.issuer,
      secret: decryptSecret(row.secret_enc),
      type: row.type,
      algorithm: row.algorithm,
      digits: row.digits,
      period: row.period,
      counter: row.counter,
      encoding: row.encoding,
    }));

    return NextResponse.json({
      app: "2fa-authenticator",
      version: 1,
      exportedAt: new Date().toISOString(),
      credentials,
    });
  } catch (e) {
    return handleServerError(e);
  }
}
