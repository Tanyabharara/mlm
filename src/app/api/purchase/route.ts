import { getUserByFirebaseUid, updateUser, createPurchase, getPlan } from "@/lib/firebase-db";
import { distributeIncome } from "@/lib/income-engine";
import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";

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

    const plan = await getPlan(String(planId));
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const user = await getUserByFirebaseUid(verifiedUid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const purchase = await createPurchase({
      userId: user.id,
      planId: planId,
    });

    await updateUser(user.id, { planId: planId });

    await distributeIncome(purchase.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}
