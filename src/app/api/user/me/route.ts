import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    const verifiedUid = await verifyAuthToken(req);

    if (!verifiedUid || verifiedUid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: verifiedUid },
      include: {
        plan: true,
        referredBy: {
          select: {
            id: true,
            name: true,
            referralCode: true,
            role: true
          }
        },
        referrals: {
          select: {
            id: true,
            name: true,
            email: true,
            planId: true,
            createdAt: true,
            isBlocked: true
          },
          take: 50,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        walletBalance: user.walletBalance.toString(), // Decimal to string for JSON
      },
    });
  } catch (error: any) {
    console.error("[API User Me] Error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
