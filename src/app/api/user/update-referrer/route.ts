import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import {
  getUserByFirebaseUid,
  getUserByReferralCode,
  getUserById,
  updateUser,
} from "@/lib/firebase-db";

export async function POST(req: Request) {
  try {
    const { referrerCode } = await req.json();
    const verifiedUid = await verifyAuthToken(req);

    if (!verifiedUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!referrerCode || typeof referrerCode !== "string") {
      return NextResponse.json({ error: "Referrer code is required" }, { status: 400 });
    }

    const user: any = await getUserByFirebaseUid(verifiedUid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.planId) {
      return NextResponse.json({ error: "Cannot change referrer after plan activation" }, { status: 400 });
    }

    const referredBy = user.referredById ? await getUserById(user.referredById) : null;
    const currentReferrerIsAdminOrNull = !user.referredById || (referredBy as any)?.role === "ADMIN";
    if (!currentReferrerIsAdminOrNull) {
      return NextResponse.json({ error: "Cannot change referrer: you were referred by another partner" }, { status: 400 });
    }

    const newReferrer = await getUserByReferralCode(referrerCode.trim().toUpperCase());
    if (!newReferrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    if (newReferrer.id === user.id) {
      return NextResponse.json({ error: "You cannot refer yourself" }, { status: 400 });
    }

    const updatedUser = await updateUser(user.id, { referredById: newReferrer.id });
    const referredByNew = updatedUser ? await getUserById((updatedUser as any).referredById) : null;
    return NextResponse.json({
      user: { ...updatedUser, referredBy: referredByNew },
    });
  } catch (error: any) {
    console.error("[API Update Referrer] Error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
