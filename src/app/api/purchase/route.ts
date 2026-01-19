import { ensureUserExists, updateUser, createPurchase } from "@/lib/firebase-db";
import { distributeIncome } from "@/lib/income-engine";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { uid, planId, email, name, photoURL } = await req.json();

    const user = await ensureUserExists(uid, { email, name, photoURL });

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
