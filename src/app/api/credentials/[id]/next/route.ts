import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { handleServerError, jsonError, computeCode } from "@/lib/credential-service";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** POST /api/credentials/[id]/next — advance an HOTP credential to its next code. */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in first.", 401);
    const { id } = await params;

    const db = getDb();
    const newCounter = await db.incrementHotpCounter(userId, id);
    if (newCounter === null) return jsonError("Credential not found.", 404);

    const rows = await db.listCredentials(userId);
    const row = rows.find((r) => r.id === id);
    if (!row) return jsonError("Credential not found.", 404);

    const { code } = await computeCode(row);
    return NextResponse.json({ code, counter: newCounter });
  } catch (e) {
    return handleServerError(e);
  }
}
