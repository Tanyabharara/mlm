import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getTransactions } from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("email") || "tanyabharara2003@gmail.com";
    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: "Not found" });

    const txs = await getTransactions(user.id, 50);

    return NextResponse.json({
        email: user.email,
        walletBalance: user.walletBalance,
        transactions: txs
    });
}
