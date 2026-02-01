import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  getUsersWithPlan,
  getOttSubscriptionsByUser,
  getPlan,
  createOttSubscription,
} from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersWithPlan = await getUsersWithPlan();
    const users: any[] = [];

    for (const user of usersWithPlan) {
      const subs = await getOttSubscriptionsByUser(user.id);
      const hasActive = subs.some((s: any) => s.status === "ACTIVE");
      if (!hasActive) {
        const plan = user.planId ? await getPlan(user.planId) : null;
        users.push({
          id: user.id,
          name: user.name,
          email: user.email,
          planId: user.planId,
          plan,
          createdAt: user.createdAt,
          ottSubscriptions: subs.slice(0, 1),
        });
      }
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("[API Admin Subscriptions] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, platform, username, password, link } = await req.json();

    if (!userId || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subscription = await createOttSubscription({
      userId: String(userId),
      platform,
      username,
      password,
      link,
      status: "ACTIVE",
    });

    return NextResponse.json({ message: "Subscription assigned successfully", subscription });
  } catch (error: any) {
    console.error("[API Admin Subscriptions POST] Error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
