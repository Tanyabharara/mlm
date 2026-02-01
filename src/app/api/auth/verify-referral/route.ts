import { NextResponse } from "next/server";
import { getUserByReferralCode } from "@/lib/firebase-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const user = await getUserByReferralCode(code.toUpperCase());

    if (!user) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({ valid: true, name: (user as any).name });
  } catch (error: any) {
    console.error("[API Verify Referral] Error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
