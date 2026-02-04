
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
    updateOttSubscription,
    getOttSubscriptionById,
    updateUser,
    createPurchase,
    getPlans
} from "@/lib/firebase-db";
import { distributeIncome } from "@/lib/income-engine";

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { subscriptionId, ottId, password, platform, action } = await req.json();

        if (!subscriptionId) {
            return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
        }

        const subscription = await getOttSubscriptionById(subscriptionId);
        if (!subscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        if (action === "REJECT") {
            await updateOttSubscription(subscriptionId, { status: "REJECTED" });
            return NextResponse.json({ success: true, message: "Subscription rejected" });
        }

        // Action is APPROVE
        if (!ottId) {
            return NextResponse.json({ error: "OTT ID is required for approval" }, { status: 400 });
        }

        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // 1. Update OTT Subscription
        await updateOttSubscription(subscriptionId, {
            status: "ACTIVE",
            username: ottId,
            password: password || "12345",
            platform: platform || subscription.platform || "PREMIUM_ACCESS",
            expiresAt: expiresAt,
            approvedAt: now
        });

        // 2. Activate Plan for User
        const plans = await getPlans();
        const plan = plans[0];
        if (plan) {
            await updateUser(subscription.userId, { planId: plan.id });

            const purchase = await createPurchase({
                userId: subscription.userId,
                planId: plan.id
            });

            // 3. Distribute MLM Income
            await distributeIncome(purchase.id);
            console.log(`[Admin Approve] Activated plan and distributed income for User ${subscription.userId}`);
        }

        return NextResponse.json({
            success: true,
            message: "Subscription approved and plan activated successfully"
        });

    } catch (error: any) {
        console.error("[API Admin OTT Approve] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
