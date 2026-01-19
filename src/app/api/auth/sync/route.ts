import { ensureUserExists, getUserByReferralCode, updateUser } from "@/lib/firebase-db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, name, photoURL, referralCode } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let user = await ensureUserExists(uid, { email, name, photoURL });

    if (referralCode && !user.referredById) {
      const referrer = await getUserByReferralCode(referralCode);
      if (referrer && referrer.id !== user.id) {
        user = await updateUser(user.id, { referredById: referrer.id });
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
