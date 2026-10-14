import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { newId } from "@/lib/crypto.server";
import { validateCredentialInput } from "@/lib/validate";
import {
  handleServerError,
  jsonError,
  rowsToViews,
  rowToView,
  computeCode,
} from "@/lib/credential-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/credentials — all of the signed-in user's credentials with live codes. */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in to load your credentials.", 401);

    const rows = await getDb().listCredentials(userId);
    const views = await rowsToViews(rows);
    return NextResponse.json({ credentials: views });
  } catch (e) {
    return handleServerError(e);
  }
}

/** POST /api/credentials — add one credential for the signed-in user. */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in to save credentials to your account.", 401);

    const body = await request.json().catch(() => null);
    const input = validateCredentialInput(body);
    if (!input.ok) return jsonError(input.error!, 400);

    const db = getDb();
    const id = newId();
    await db.insertCredential(userId, id, input.value!);

    const rows = await db.listCredentials(userId);
    const row = rows.find((r) => r.id === id);
    if (!row) return jsonError("Could not read back the saved credential.", 500);

    const { code, expiresAt } = await computeCode(row);
    return NextResponse.json(
      { credential: rowToView(row, code, expiresAt || null) },
      { status: 201 },
    );
  } catch (e) {
    return handleServerError(e);
  }
}
