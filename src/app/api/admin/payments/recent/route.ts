import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getRecentPaymentIntents, getUserById } from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payments = await getRecentPaymentIntents(10);
    const paymentsWithUser = await Promise.all(
      payments.map(async (p: any) => {
        const user = p.userId ? await getUserById(p.userId) : null;
        return {
          ...p,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return NextResponse.json({ payments: paymentsWithUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
