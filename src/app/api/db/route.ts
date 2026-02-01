import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-db";

export async function GET() {
  const hasFirebase = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  try {
    const ref = firestore.collection("users").limit(1);
    await ref.get();
    return NextResponse.json({
      ok: true,
      message: "Firestore connected",
      env: { FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "(not set)" },
    });
  } catch (e: unknown) {
    const err = e as Error & { code?: string };
    console.error("[DB] /api/db Firestore check failed:", { message: err.message, code: err.code });
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        code: err.code ?? null,
        env: { FIREBASE_PROJECT_ID: hasFirebase ? "set" : "(not set)" },
      },
      { status: 503 }
    );
  }
}
