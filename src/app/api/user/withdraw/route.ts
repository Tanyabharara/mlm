
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import {
    getUserByFirebaseUid,
    createWithdrawalRequest,
    updateWalletBalance,
    createTransaction
} from "@/lib/firebase-db";

export async function POST(req: NextRequest) {
    try {
        const verifiedUid = await verifyAuthToken(req);
        if (!verifiedUid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user: any = await getUserByFirebaseUid(verifiedUid);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { amount } = await req.json();
        const withdrawAmount = Number(amount);

        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
        }

        if (user.walletBalance < withdrawAmount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // 1. Create Withdrawal Request
        const request = await createWithdrawalRequest({
            userId: user.id,
            amount: withdrawAmount,
        });

        // 2. Deduct (Lock) from wallet balance
        await updateWalletBalance(user.id, -withdrawAmount, "increment");

        // 3. Log Transaction as DEBIT (Status: PENDING)
        await createTransaction({
            userId: user.id,
            amount: withdrawAmount,
            type: "DEBIT",
            category: "WITHDRAWAL",
            description: `Withdrawal request of $${withdrawAmount.toFixed(2)} (Pending Admin Approval)`,
        });

        return NextResponse.json({
            success: true,
            message: "Withdrawal request submitted successfully",
            request
        });

    } catch (error: any) {
        console.error("[API User Withdraw] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const verifiedUid = await verifyAuthToken(req);
        if (!verifiedUid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user: any = await getUserByFirebaseUid(verifiedUid);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { getWithdrawalRequestsByUser } = await import("@/lib/firebase-db");
        const withdrawals = await getWithdrawalRequestsByUser(user.id);

        return NextResponse.json({ withdrawals });
    } catch (error: any) {
        console.error("[API User Withdraw GET] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
