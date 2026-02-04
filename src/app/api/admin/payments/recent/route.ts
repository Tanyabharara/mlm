import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getUserById, firestore as db, getTotalMilestonePayouts } from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get ALL payments for revenue calculation and total count
    const allIntentsSnapshot = await db.collection("paymentIntents").orderBy("createdAt", "desc").get();
    const allIntents = allIntentsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const verifiedPayments = allIntents.filter((p: any) => p.status === "VERIFIED");
    const totalCollected = verifiedPayments.reduce((acc: number, p: any) => acc + Number(p.amount), 0);

    // Fetch persistent Platform Pool balance
    const { getAppConfig } = await import("@/lib/firebase-db");
    const poolBalanceDoc = await getAppConfig("PLATFORM_POOL_BALANCE");
    const totalPlatformPool = parseFloat(poolBalanceDoc?.value || "0");

    const totalOttFund = verifiedPayments.length * 5;

    const paginatedIntents = allIntents.slice(skip, skip + limit);

    const paymentsWithUser = await Promise.all(
      paginatedIntents.map(async (p: any) => {
        const user = p.userId ? await getUserById(p.userId) : null;
        return {
          ...p,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return NextResponse.json({
      payments: paymentsWithUser,
      totalCollected,
      totalOttFund,
      totalPlatformPool,
      totalCount: allIntents.length,
      page,
      totalPages: Math.ceil(allIntents.length / limit)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
