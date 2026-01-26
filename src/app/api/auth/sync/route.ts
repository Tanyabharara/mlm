import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateUniqueReferralCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
    attempts++;
  }
  throw new Error("Referral code generation failed");
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

    // 1. Find or Create User
    let user = await prisma.user.findUnique({
      where: { firebaseUid: verifiedUid }
    });

    if (!user) {
      const newCode = await generateUniqueReferralCode();
      user = await prisma.user.create({
        data: {
          firebaseUid: verifiedUid,
          email,
          name: name || "User",
          photoURL: photoURL || "",
          referralCode: newCode,
          role: "USER"
        }
      });
    }

    // 2. Referral logic (Only if not already referred)
    if (!user.referredById) {
      let referrerId: number | null = null;

      // Admin Fallback Logic
      if (!providedCode || providedCode.toUpperCase() === 'OTTFY_ADMIN') {
        const admin = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          orderBy: { id: 'asc' }
        });
        if (admin) referrerId = admin.id;
      } else {
        // Specific Referrer
        const referrer = await prisma.user.findUnique({
          where: { referralCode: providedCode }
        });
        if (referrer && referrer.id !== user.id) {
          referrerId = referrer.id;
        } else {
          // Invalid code -> Admin Fallback
          const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            orderBy: { id: 'asc' }
          });
          if (admin) referrerId = admin.id;
        }
      }

      if (referrerId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { referredById: referrerId }
        });
      }
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("[API Auth Sync] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
