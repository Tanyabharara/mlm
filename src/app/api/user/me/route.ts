import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import {
  getUserByFirebaseUid,
  getPlan,
  getDirectReferrals,
  getOttSubscriptionsByUser,
  updateUser,
} from "@/lib/firebase-db";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    const verifiedUid = await verifyAuthToken(req);

    if (!verifiedUid || verifiedUid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user: any = await getUserByFirebaseUid(verifiedUid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscriptions = await getOttSubscriptionsByUser(user.id);
    const latestActive = subscriptions
      .filter((s: any) => s.status === "ACTIVE")
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    let plan = user.planId ? await getPlan(user.planId) : null;

    if (plan && latestActive) {
      const expiresAt = latestActive.expiresAt ? (latestActive.expiresAt.toDate ? latestActive.expiresAt.toDate() : new Date(latestActive.expiresAt)) : null;
      if (expiresAt && expiresAt < new Date()) {
        // Plan expired
        plan = null;
        // Optionally update DB to clear planId
        await updateUser(user.id, { planId: null });
        user.planId = null;
      }
    }
    const referralsSlice = await getDirectReferrals(user.id, 50);

    return NextResponse.json({
      user: {
        ...user,
        walletBalance: String(user.walletBalance ?? 0),
        plan,
        referredBy: user.referredById ? { id: user.referredById } : null,
        referrals: referralsSlice.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          planId: r.planId,
          createdAt: r.createdAt,
          isBlocked: r.isBlocked,
        })),
      },
    });
  } catch (error: any) {
    console.error("[API User Me] Error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
