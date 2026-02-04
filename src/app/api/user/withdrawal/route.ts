import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import {
  getUserByFirebaseUid,
  createWithdrawalRequest,
  getWithdrawalRequestsByUser,
} from "@/lib/firebase-db";

export async function POST(req: Request) {
  try {
    const verifiedUid = await verifyAuthToken(req);
    if (!verifiedUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, walletAddress } = await req.json();

    if (!amount || !walletAddress) {
      return NextResponse.json({ error: "Amount and wallet address required" }, { status: 400 });
    }

    const user: any = await getUserByFirebaseUid(verifiedUid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validation
    const withdrawAmount = Number(amount);

    if (withdrawAmount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
    }

    if (withdrawAmount > Number(user.walletBalance)) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Validate BEP-20 address format (0x + 40 hex characters)
    const addressPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!addressPattern.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid BEP-20 wallet address format" }, { status: 400 });
    }

    // Check for pending withdrawals
    const existingRequests = await getWithdrawalRequestsByUser(user.id);
    const hasPending = existingRequests.some((w: any) => w.status === "PENDING");

    if (hasPending) {
      return NextResponse.json({ error: "You have a pending withdrawal request" }, { status: 400 });
    }

    // Create withdrawal request (do NOT deduct from wallet yet - wait for admin approval)
    const withdrawal = await createWithdrawalRequest({
      userId: user.id,
      amount: withdrawAmount,
      walletAddress,
      status: "PENDING"
    });

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal.id,
      message: "Withdrawal request submitted. Admin will process within 24-48 hours."
    });

  } catch (error: any) {
    console.error("[API Withdrawal] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const verifiedUid = await verifyAuthToken(req);
    if (!verifiedUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user: any = await getUserByFirebaseUid(verifiedUid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const withdrawals = await getWithdrawalRequestsByUser(user.id);

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    console.error("[API Withdrawal GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
