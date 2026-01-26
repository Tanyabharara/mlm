import { verifyAuthToken } from "@/lib/auth-server";
import { convertToUSDT } from "@/lib/usdt";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { distributeIncome } from "@/lib/income-engine";
import { getUserByFirebaseUid } from "@/lib/firebase-db";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { uid, planId } = await req.json();

    const verifiedUid = await verifyAuthToken(req);
    if (!verifiedUid || verifiedUid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    // 1. Get user from Postgres (or sync from Firestore)
    let dbUser = await prisma.user.findUnique({
      where: { firebaseUid: verifiedUid }
    });

    if (!dbUser) {
      const firebaseUser: any = await getUserByFirebaseUid(verifiedUid);
      if (!firebaseUser) {
        return NextResponse.json({ error: "User not found in registry" }, { status: 404 });
      }
      dbUser = await prisma.user.create({
        data: {
          firebaseUid: verifiedUid,
          email: firebaseUser.email,
          name: firebaseUser.name,
          referralCode: firebaseUser.referralCode,
          referredById: null, // Default
        }
      });
    }

    // 2. Load Plan
    const targetPlan = await prisma.plan.findFirst({
      where: { id: Number(planId) }
    });

    if (!targetPlan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // 3. Register Purchase in Postgres
    const purchase = await prisma.purchase.create({
      data: {
        userId: dbUser.id,
        planId: targetPlan.id,
      }
    });

    // 4. Update user plan and role in DB
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { planId: targetPlan.id }
    });

    // 5. Trigger Income Logic (Direct + Pool)
    await distributeIncome(purchase.id);

    return NextResponse.json({
      success: true,
      usdtAmount: convertToUSDT(Number(targetPlan.price)),
      message: "Purchase activated and income distributed!",
      walletRecommendations: ["TronLink", "Trust Wallet (TRC20)"]
    });
  } catch (error) {
    console.error("Purchase execution failed:", error);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
