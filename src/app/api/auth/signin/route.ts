import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/crypto.server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { validateUsername, validatePassword } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { handleServerError, jsonError } from "@/lib/credential-service";

export const runtime = "nodejs";

/** Precomputed hash so "unknown user" burns the same CPU as a real check. */
let dummyHash: string | null = null;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const username = validateUsername(body?.username);
    const password = validatePassword(body?.password);

    const rlKey = `signin:${clientIp(request)}:${typeof body?.username === "string" ? body.username.slice(0, 40) : ""}`;
    const rl = rateLimit(rlKey, 10, 10 * 60 * 1000);
    if (!rl.allowed) {
      return jsonError(
        `Too many attempts. Try again in ${rl.retryAfterSeconds}s.`,
        429,
      );
    }

    if (!username.ok || !password.ok) {
      if (!dummyHash) dummyHash = await hashPassword("timing-equalizer-123");
      await verifyPassword(password.value ?? "x", dummyHash);
      return jsonError("Invalid username or password.", 401);
    }

    const db = getDb();
    const user = await db.getUserByUsername(username.value!);
    if (!user) {
      if (!dummyHash) dummyHash = await hashPassword("timing-equalizer-123");
      await verifyPassword(password.value!, dummyHash);
      return jsonError("Invalid username or password.", 401);
    }

    const valid = await verifyPassword(password.value!, user.password_hash);
    if (!valid) {
      return jsonError("Invalid username or password.", 401);
    }

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt:
          user.created_at instanceof Date
            ? user.created_at.toISOString()
            : new Date(user.created_at).toISOString(),
      },
    });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    return handleServerError(e);
  }
}
