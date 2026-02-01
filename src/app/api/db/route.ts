import { NextResponse } from "next/server";
import prisma, { logDbConnection } from "@/lib/prisma";

/**
 * GET /api/db - Test DB connection and return exact status/error.
 * Use this to debug connection issues (check server logs + response).
 */
export async function GET() {
  const hasUrl = !!process.env.DATABASE_URL;
  const urlPreview = hasUrl
    ? process.env.DATABASE_URL!.replace(/:[^:@]+@/, ":****@").slice(0, 60) + "..."
    : "(not set)";

  try {
    await prisma.$connect();
    return NextResponse.json({
      ok: true,
      message: "DB connected",
      env: { DATABASE_URL: urlPreview },
    });
  } catch (e: unknown) {
    const err = e as Error & { code?: string; meta?: unknown };
    console.error("[DB] /api/db connection failed:", {
      message: err.message,
      code: err.code,
      meta: err.meta,
    });
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        code: err.code ?? null,
        meta: err.meta ?? null,
        env: { DATABASE_URL: urlPreview },
      },
      { status: 503 }
    );
  }
}
