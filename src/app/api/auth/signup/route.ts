import { NextRequest, NextResponse } from "next/server";
import { getDb, isUniqueViolation } from "@/lib/db";
import { hashPassword, newId } from "@/lib/crypto.server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { validateUsername, validatePassword } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { handleServerError, jsonError } from "@/lib/credential-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`signup:${clientIp(request)}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return jsonError(
        `Too many sign-up attempts. Try again in ${rl.retryAfterSeconds}s.`,
        429,
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const username = validateUsername(body?.username);
    if (!username.ok) return jsonError(username.error!, 400);
    const password = validatePassword(body?.password);
    if (!password.ok) return jsonError(password.error!, 400);

    const db = getDb();
    const id = newId();
    const passwordHash = await hashPassword(password.value!);

    try {
      await db.createUser(id, username.value!, passwordHash);
    } catch (e) {
      if (isUniqueViolation(e)) {
        return jsonError("That username is already taken.", 409);
      }
      throw e;
    }

    const token = await createSessionToken(id);
    const res = NextResponse.json(
      { user: { id, username: username.value!, createdAt: new Date().toISOString() } },
      { status: 201 },
    );
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    return handleServerError(e);
  }
}
