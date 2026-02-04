
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
    getAllWithdrawalRequests,
    getUserById,
    updateWithdrawalRequest,
    updateWalletBalance,
    createTransaction
} from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const withdrawals = await getAllWithdrawalRequests(100);
        const withdrawalsWithUser = await Promise.all(
            withdrawals.map(async (w: any) => {
                const user = await getUserById(w.userId);
                return {
                    ...w,
                    user: user ? { name: user.name, email: user.email } : null
                };
            })
        );

        return NextResponse.json({ withdrawals: withdrawalsWithUser });
    } catch (error: any) {
        console.error("[API Admin Withdrawals] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { withdrawalId, action } = await req.json();

        if (!withdrawalId || !action) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const { getWithdrawalRequestById } = await import("@/lib/firebase-db");
        const withdrawal = await getWithdrawalRequestById(withdrawalId);
        if (!withdrawal) {
            return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
        }

        if (withdrawal.status !== "PENDING") {
            return NextResponse.json({ error: "Request already processed" }, { status: 400 });
        }

        if (action === "APPROVE") {
            await updateWithdrawalRequest(withdrawalId, {
                status: "APPROVED",
                processedAt: new Date(),
                processedBy: admin.id
            });

            // No need to deduct balance here as it was deducted during request creation
            // But we log a transaction to confirm final settlement
            await createTransaction({
                userId: withdrawal.userId,
                amount: withdrawal.amount,
                type: "DEBIT",
                category: "WITHDRAWAL_SETTLED",
                description: `Withdrawal of $${Number(withdrawal.amount).toFixed(2)} finalized and paid.`,
            });

            return NextResponse.json({ success: true, message: "Withdrawal approved" });
        } else if (action === "REJECT") {
            await updateWithdrawalRequest(withdrawalId, {
                status: "REJECTED",
                processedAt: new Date(),
                processedBy: admin.id
            });

            // Refund the locked balance
            await updateWalletBalance(withdrawal.userId, Number(withdrawal.amount), "increment");

            await createTransaction({
                userId: withdrawal.userId,
                amount: withdrawal.amount,
                type: "CREDIT",
                category: "WITHDRAWAL_REFUND",
                description: `Refund of $${Number(withdrawal.amount).toFixed(2)} due to withdrawal rejection.`,
            });

            return NextResponse.json({ success: true, message: "Withdrawal rejected and balance refunded" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("[API Admin Withdrawals POST] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
