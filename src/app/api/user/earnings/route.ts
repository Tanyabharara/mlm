import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    try {
        const headersList = await headers();
        const userEmail = headersList.get("x-user-email");

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Since we don't have separate fields for direct/team income in schema yet,
        // we calculate them based on transaction descriptions as a placeholder.
        const directIncome = user.transactions
            .filter(t => t.type === "CREDIT" && t.description?.toLowerCase().includes("direct"))
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const teamIncome = user.transactions
            .filter(t => t.type === "CREDIT" && t.description?.toLowerCase().includes("referral"))
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const totalEarnings = user.transactions
            .filter(t => t.type === "CREDIT")
            .reduce((acc, t) => acc + Number(t.amount), 0);

        return NextResponse.json({
            totalEarnings: totalEarnings.toFixed(2),
            directIncome: directIncome.toFixed(2),
            teamIncome: teamIncome.toFixed(2),
            recentTransactions: user.transactions.map(t => ({
                ...t,
                amount: Number(t.amount).toFixed(2),
            })),
        });
    } catch (error) {
        console.error("Error fetching earnings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
