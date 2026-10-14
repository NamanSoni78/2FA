import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getDb, decryptSecret } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto.server";
import { rateLimit } from "@/lib/rate-limit";
import { handleServerError, jsonError } from "@/lib/credential-service";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/credentials/[id]/reveal — returns the plaintext secret, but only
 * after re-confirming the account password. Secrets are otherwise never sent
 * back to the browser.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in first.", 401);
    const { id } = await params;

    const rl = rateLimit(`reveal:${userId}`, 10, 5 * 60 * 1000);
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
    const row = rows.find((r) => r.id === id);
    if (!row) return jsonError("Credential not found.", 404);

    return NextResponse.json({ secret: decryptSecret(row.secret_enc) });
  } catch (e) {
    return handleServerError(e);
  }
}
