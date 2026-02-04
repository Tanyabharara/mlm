import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import {
  getUserByFirebaseUid,
  getUserByEmail,
  getUserByReferralCode,
  createUser,
  updateUser,
} from "@/lib/firebase-db";

async function generateUniqueReferralCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 20) {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.random().toString(36).substring(2, 4).toUpperCase();
    const code = `REF-${part1}-${part2}`;
    const existing = await getUserByReferralCode(code);
    if (!existing) return code;
    attempts++;
  }
  return "REF-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, photoURL } = body;
    let { referralCode: providedCode } = body;

    const verifiedUid = await verifyAuthToken(req);
    if (!verifiedUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let user = await getUserByFirebaseUid(verifiedUid);

    if (!user) {
      // Check if user exists by email (to handle UID linkage/conflicts)
      user = await getUserByEmail(email);

      if (user) {
        // Link the existing record with the new Firebase UID
        user = await updateUser(user.id, { firebaseUid: verifiedUid });
      } else {
        // New user: Create entirely fresh record
        const newCode = await generateUniqueReferralCode();
        user = await createUser({
          firebaseUid: verifiedUid,
          email,
          name: name || "User",
          photoURL: photoURL || "",
          referralCode: newCode,
          role: "USER",
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to sync user data" }, { status: 500 });
    }

    // Enforce mandatory referral code for users without referrer
    if (!user.referredById) {
      const effectiveCode = providedCode && typeof providedCode === "string" ? providedCode.trim()?.toUpperCase() : null;

      // Block registration without valid referral code
      if (!effectiveCode || effectiveCode === "OTTFY_ADMIN") {
        return NextResponse.json({
          error: "Valid referral code required for registration. Please contact your referrer."
        }, { status: 403 });
      }

      const referrer = await getUserByReferralCode(effectiveCode);
      if (!referrer || referrer.id === user.id) {
        return NextResponse.json({
          error: "Invalid referral code. Please verify and try again."
        }, { status: 403 });
      }

      // Set referrer
      user = await updateUser(user.id, { referredById: referrer.id });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("[API Auth Sync] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
