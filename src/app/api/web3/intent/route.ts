import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-db";
import {
  getUserByFirebaseUid,
  createPaymentIntent,
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

    const { amount, category = "TOPUP" } = await req.json();

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const user = await getUserByFirebaseUid(firebaseUid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const intent = await createPaymentIntent({
      userId: user.id,
      amount: Number(amount),
      token: "USDT",
      network: "BSC",
      status: "INITIATED",
    });

    return NextResponse.json({ intent });
  } catch (error: any) {
    console.error("Payment intent error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
