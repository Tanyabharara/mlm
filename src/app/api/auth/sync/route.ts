import { ensureUserExists, getUserByReferralCode, updateUser } from "@/lib/firebase-db";
import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, name, photoURL, referralCode } = body;

    const verifiedUid = await verifyAuthToken(req);
    if (!verifiedUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Always trust the UID from the verified token, not from the body
    let user = await ensureUserExists(verifiedUid, { email, name, photoURL });

    if (referralCode && !user.referredById) {
      const referrer = await getUserByReferralCode(referralCode);
      if (referrer && referrer.id !== user.id) {
        try {
          user = await updateUser(user.id, { referredById: referrer.id });
        } catch (error: any) {
          if (error?.message?.includes("already referred")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
          }
          throw error;
        }
      }
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error syncing user:", error);
    if (error?.message?.includes("already exists") || error?.message?.includes("already associated")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
