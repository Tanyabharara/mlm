
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAllTransactions, getUserById } from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "50");

        const transactions = await getAllTransactions(limit);

        const transactionsWithUser = await Promise.all(
            transactions.map(async (tx: any) => {
                const user = tx.userId ? await getUserById(tx.userId) : null;

                // Handle Firestore Timestamp
                let createdAt = tx.createdAt;
                if (createdAt && typeof createdAt.toDate === 'function') {
                    createdAt = createdAt.toDate().toISOString();
                } else if (createdAt && createdAt._seconds !== undefined) {
                    createdAt = new Date(createdAt._seconds * 1000).toISOString();
                }

                // Logic for Admin Portal: 
                // User's CREDIT (Earnings) = System's DEBIT (Expense)
                // User's DEBIT (Withdrawals) = System's CREDIT (Wait, actually usually withdrawals are system debits too)
                // System Revenue (Plan Activation) = System's CREDIT (Revenue)

                let displayType = tx.type;
                const payoutCategories = ["DIRECT_INCOME", "POOL_INCOME", "MILESTONE_INCOME", "REWARD", "COMMISSION"];

                if (payoutCategories.includes(tx.category)) {
                    // From admin perspective, paying out is DEBIT
                    displayType = "DEBIT";
                } else if (tx.category === "PLAN_ACTIVATION" || tx.category === "REVENUE") {
                    // From admin perspective, receiving money is CREDIT
                    displayType = "CREDIT";
                }

                return {
                    ...tx,
                    createdAt,
                    displayType,
                    user: user ? { name: user.name, email: user.email } : null,
                };
            })
        );

        return NextResponse.json({ transactions: transactionsWithUser });
    } catch (error: any) {
        console.error("[API Admin Transactions] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
