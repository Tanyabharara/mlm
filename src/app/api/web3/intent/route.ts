import { NextRequest, NextResponse } from "next/server";
import {
  adminAuth,
  getUserByFirebaseUid,
  createPaymentIntent,
  createOttSubscription
} from "@/lib/firebase-db";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    const { amount, category = "TOPUP", platform } = await req.json();

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const user = await getUserByFirebaseUid(firebaseUid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a Payment Intent for the specified amount
    const intent = await createPaymentIntent({
      userId: user.id,
      amount: Number(amount),
      token: "USDT",
      network: "BSC",
      status: "INITIATED",
    });

    // If the intent is for a specific OTT platform, create a pending subscription
    if (platform) {
      await createOttSubscription({
        userId: user.id,
        platform: platform,
        status: "PENDING_PAYMENT",
        // Pass extra data which will be stored in Firestore
        paymentIntentId: intent.id
      } as any);
    }

    return NextResponse.json({ intent });
  } catch (error: any) {
    console.error("Payment intent error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
