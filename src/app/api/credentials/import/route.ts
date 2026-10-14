import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { validateImportArray } from "@/lib/validate";
import { handleServerError, jsonError, rowsToViews } from "@/lib/credential-service";

export const runtime = "nodejs";

/**
 * POST /api/credentials/import — bulk import (used when uploading locally
 * stored credentials after sign-in, and by the JSON import feature).
 * Body: JSON array of { label, issuer, secret, type, algorithm, digits,
 * period, counter, encoding }.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Sign in to import into your account.", 401);

    const body = await request.json().catch(() => null);
    const items = validateImportArray(body);
    if (!items.ok) return jsonError(items.error!, 400);

    const db = getDb();
    await db.bulkInsertCredentials(userId, items.value!);

    const rows = await db.listCredentials(userId);
    const views = await rowsToViews(rows);
    return NextResponse.json({ imported: items.value!.length, credentials: views });
  } catch (e) {
    return handleServerError(e);
  }
}
