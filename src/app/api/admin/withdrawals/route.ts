import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  getAllWithdrawalRequests,
  getWithdrawalRequestById,
  updateWithdrawalRequest,
  updateWalletBalance,
  createTransaction,
  getUserById,
} from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const withdrawals = await getAllWithdrawalRequests();
    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { withdrawalId, action, txHash, rejectionReason } = await req.json();

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: "Withdrawal ID and action required" }, { status: 400 });
    }

    const withdrawal: any = await getWithdrawalRequestById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
    }

    if (action === "APPROVE") {
      if (!txHash) {
        return NextResponse.json({ error: "Transaction hash required for approval" }, { status: 400 });
      }

      const user: any = await getUserById(withdrawal.userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (Number(user.walletBalance) < Number(withdrawal.amount)) {
        return NextResponse.json({ error: "User has insufficient balance" }, { status: 400 });
      }

      // Deduct from wallet
      await updateWalletBalance(withdrawal.userId, -Number(withdrawal.amount), "increment");

      // Create transaction record
      await createTransaction({
        userId: withdrawal.userId,
        amount: Number(withdrawal.amount),
        type: "DEBIT",
        category: "WITHDRAWAL",
        description: `Withdrawal to ${withdrawal.walletAddress}`,
        txHash: txHash
      });

      // Update withdrawal request
      await updateWithdrawalRequest(withdrawalId, {
        status: "APPROVED",
        txHash,
        processedAt: new Date()
      });

      return NextResponse.json({ success: true, message: "Withdrawal approved and processed" });

    } else if (action === "REJECT") {
      // Update withdrawal request
      await updateWithdrawalRequest(withdrawalId, {
        status: "REJECTED",
        rejectionReason: rejectionReason || "Rejected by admin",
        processedAt: new Date()
      });

      return NextResponse.json({ success: true, message: "Withdrawal rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("[API Admin Withdrawals] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
