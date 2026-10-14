import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { handleServerError } from "@/lib/credential-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ user: null });

    const db = getDb();
    const user = await db.getUserById(userId);
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt:
          user.created_at instanceof Date
            ? user.created_at.toISOString()
            : new Date(user.created_at).toISOString(),
      },
    });
  } catch (e) {
    return handleServerError(e);
  }
}
