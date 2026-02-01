import { verifyAuthToken } from "@/lib/auth-server";
import { convertToUSDT } from "@/lib/usdt";
import { NextResponse } from "next/server";
import { distributeIncome } from "@/lib/income-engine";
import {
  getUserByFirebaseUid,
  ensureUserExists,
  getPlan,
  createPurchase,
  updateUser,
  getPlans,
} from "@/lib/firebase-db";

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

    let dbUser: any = await getUserByFirebaseUid(verifiedUid);

    if (!dbUser) {
      dbUser = await ensureUserExists(verifiedUid);
    }

    const planIdStr = String(planId);
    let plan = await getPlan(planIdStr);
    if (!plan) {
      const plans = await getPlans();
      plan = plans.find((p: any) => String(p.id) === planIdStr) ?? plans[0];
    }
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const purchase = await createPurchase({
      userId: dbUser.id,
      planId: plan.id,
    });

    await updateUser(dbUser.id, { planId: plan.id });

    await distributeIncome(purchase.id);

    return NextResponse.json({
      success: true,
      usdtAmount: convertToUSDT(Number(plan.price)),
      message: "Purchase activated and income distributed!",
      walletRecommendations: ["TronLink", "Trust Wallet (TRC20)"],
    });
  } catch (error) {
    console.error("Purchase execution failed:", error);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
