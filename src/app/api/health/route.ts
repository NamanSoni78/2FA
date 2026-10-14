import { NextResponse } from "next/server";
import { getDb, isDevDatabaseUrl } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public deployment health check — reports configuration readiness only,
 * never any data. Useful right after deploying to Vercel.
 */
export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const report = {
    ok: true,
    databaseUrl: Boolean(url),
    encryptionKey: false,
    sessionSecret: Boolean(
      process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32,
    ),
    database: false,
    mode: isDevDatabaseUrl(url) ? "mock (dev only)" : "neon",
  };

  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY ?? "", "base64");
    report.encryptionKey = key.length === 32;
  } catch {
    report.encryptionKey = false;
  }

  report.ok = report.databaseUrl && report.encryptionKey && report.sessionSecret;

  if (report.databaseUrl) {
    try {
      report.database = await getDb().health();
      report.ok = report.ok && report.database;
    } catch {
      report.database = false;
      report.ok = false;
    }
  }

  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
