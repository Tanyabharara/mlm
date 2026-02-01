import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import {
  getUserByFirebaseUid,
  getUserByReferralCode,
  getFirstAdminUser,
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
    const { uid, email, name, photoURL } = body;
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

    if (!user.referredById) {
      let referrerId: string | null = null;
      const effectiveCode = providedCode && typeof providedCode === "string" ? providedCode.trim() : null;

      if (effectiveCode && effectiveCode.toUpperCase() !== "OTTFY_ADMIN") {
        const referrer = await getUserByReferralCode(effectiveCode.toUpperCase());
        if (referrer && referrer.id !== user.id) {
          referrerId = referrer.id;
        }
      }

      if (!referrerId) {
        const admin = await getFirstAdminUser();
        if (admin) referrerId = admin.id;
      }

      if (referrerId) {
        user = await updateUser(user.id, { referredById: referrerId });
      }
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("[API Auth Sync] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
