import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  getAllUsers,
  getOttSubscriptionsByUser,
  getPlan,
  createOttSubscription,
  firestore as adminDb,
} from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const history = searchParams.get("history") === "true";

    if (history) {
      const subsSnapshot = await adminDb.collection("ottSubscriptions")
        .where("status", "==", "ACTIVE")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      const historyItems = await Promise.all(subsSnapshot.docs.map(async (doc) => {
        const sub = { id: doc.id, ...doc.data() as any };
        const user = await adminDb.collection("users").doc(sub.userId).get();
        return {
          ...sub,
          userName: user.exists ? (user.data()?.name || "Anonymous") : "Deleted User",
          userEmail: user.exists ? (user.data()?.email || "") : ""
        };
      }));
      return NextResponse.json({ history: historyItems });
    }

    const allUsers = await getAllUsers();
    const users: any[] = [];

    for (const user of allUsers) {
      // Check if user already has an active OTT subscription
      const subs = await getOttSubscriptionsByUser(user.id);
      const hasActive = subs.some((s: any) => s.status === "ACTIVE");

      if (!hasActive) {
        // Find if they have any payment intent (pending or verified)
        const intents = await adminDb.collection("paymentIntents")
          .where("userId", "==", user.id)
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        const latestIntent = intents.empty ? null : { id: intents.docs[0].id, ...intents.docs[0].data() as any };
        const plan = user.planId ? await getPlan(user.planId) : null;

        users.push({
          id: user.id,
          name: user.name,
          email: user.email,
          planId: user.planId,
          plan,
          createdAt: user.createdAt,
          paymentStatus: user.planId ? "VERIFIED" : (latestIntent ? latestIntent.status : "NO_PAYMENT"),
          latestIntentId: latestIntent?.id,
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

import { finalizePayment } from "@/lib/blockchain";
import {
  getPlans,
  updateUser,
  createPurchase,
} from "@/lib/firebase-db";
import { distributeIncome } from "@/lib/income-engine";

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, platform, username, password, link, paymentIntentId } = await req.json();

    if (!userId || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Assign OTT Credentials
    const subscription = await createOttSubscription({
      userId: String(userId),
      platform,
      username,
      password,
      link,
      status: "ACTIVE",
    });

    // 2. Manual Activation Check
    // If a paymentIntent was pending, finalize it now
    if (paymentIntentId) {
      try {
        await finalizePayment(paymentIntentId, `manual_admin_${Date.now()}`, 6);
      } catch (e: any) {
        console.error("Error finalizing payment during fulfillment:", e.message);
      }
    } else {
      // Fallback: If no intent but user has no plan, activate manually
      const allUsers = await getAllUsers();
      const user = allUsers.find(u => u.id === userId);
      if (user && !user.planId) {
        const plans = await getPlans();
        const plan = plans[0];
        if (plan) {
          await updateUser(user.id, { planId: plan.id });
          const purchase = await createPurchase({ userId: user.id, planId: plan.id });
          await distributeIncome(purchase.id);
        }
      }
    }

    return NextResponse.json({ message: "Credentialed & Activated successfully", subscription });
  } catch (error: any) {
    console.error("[API Admin Subscriptions POST] Error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
