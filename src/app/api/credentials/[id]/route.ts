import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { validateCredentialPatch } from "@/lib/validate";
import {
  handleServerError,
  jsonError,
  rowToView,
  computeCode,
} from "@/lib/credential-service";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/credentials/[id] — full update (edit dialog sends complete state). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in first.", 401);
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const patch = validateCredentialPatch(body);
    if (!patch.ok) return jsonError(patch.error!, 400);

    const db = getDb();
    const updated = await db.updateCredential(userId, id, patch.value!);
    if (!updated) return jsonError("Credential not found.", 404);

    const rows = await db.listCredentials(userId);
    const row = rows.find((r) => r.id === id);
    if (!row) return jsonError("Credential not found.", 404);

    const { code, expiresAt } = await computeCode(row);
    return NextResponse.json({ credential: rowToView(row, code, expiresAt || null) });
  } catch (e) {
    return handleServerError(e);
  }
}

/** DELETE /api/credentials/[id] */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in first.", 401);
    const { id } = await params;

    const deleted = await getDb().deleteCredential(userId, id);
    if (!deleted) return jsonError("Credential not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleServerError(e);
  }
}
