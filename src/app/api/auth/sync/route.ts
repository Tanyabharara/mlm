import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, name, photoURL, referralCode } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      // Create new user
      // Handle referral logic
      let referrerId = null;
      if (referralCode) {
        const referrer = await prisma.user.findUnique({
            where: { referralCode },
        });
        if (referrer) {
            referrerId = referrer.id;
        }
      }

      // Generate own referral code (simple random for now)
      const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email,
          name,
          photoURL,
          referralCode: newReferralCode,
          referredById: referrerId,
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
