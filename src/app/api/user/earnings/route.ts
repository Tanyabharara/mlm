import { getUserByEmail, getTransactions, getUserByFirebaseUid } from "@/lib/firebase-db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase-db";

export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization") || "";
    const userEmail = headersList.get("x-user-email");
    const userUidHeader = headersList.get("x-user-uid");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.substring("Bearer ".length).trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let verifiedUid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      verifiedUid = decoded.uid;
    } catch (error) {
      console.error("Failed to verify Firebase ID token:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    if (userUidHeader && userUidHeader !== verifiedUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    user = await getUserByFirebaseUid(verifiedUid);
    if (!user && userEmail) {
      user = await getUserByEmail(userEmail);
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await getTransactions(user.id, 10);

    const directIncome = transactions
      .filter((t) => t.type === "CREDIT" && t.description?.toLowerCase().includes("direct"))
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const teamIncome = transactions
      .filter((t) => t.type === "CREDIT" && t.description?.toLowerCase().includes("referral"))
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalEarnings = transactions
      .filter((t) => t.type === "CREDIT")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    return NextResponse.json({
      totalEarnings: totalEarnings.toFixed(2),
      directIncome: directIncome.toFixed(2),
      teamIncome: teamIncome.toFixed(2),
      recentTransactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount).toFixed(2),
      })),
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
