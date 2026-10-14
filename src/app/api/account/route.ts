import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, clearSessionCookie } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto.server";
import { rateLimit } from "@/lib/rate-limit";
import { handleServerError, jsonError } from "@/lib/credential-service";

export const runtime = "nodejs";

/**
 * DELETE /api/account — permanently deletes the account and every stored
 * credential (cascade). Requires password confirmation.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in first.", 401);

    const rl = rateLimit(`delete-account:${userId}`, 5, 10 * 60 * 1000);
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

    await db.deleteUserCascade(userId);

    const res = NextResponse.json({ ok: true });
    clearSessionCookie(res);
    return res;
  } catch (e) {
    return handleServerError(e);
  }
}
