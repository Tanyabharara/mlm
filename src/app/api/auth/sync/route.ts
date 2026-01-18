import { getUserByFirebaseUid, getUserByReferralCode, createUser } from "@/lib/firebase-db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, name, photoURL, referralCode } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let user = await getUserByFirebaseUid(uid);

    if (!user) {
      let referrerId = null;
      if (referralCode) {
        const referrer = await getUserByReferralCode(referralCode);
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      user = await createUser({
        firebaseUid: uid,
        email,
        name,
        photoURL,
        referralCode: newReferralCode,
        referredById: referrerId,
        role: "USER",
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
