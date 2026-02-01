import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { finalizePayment } from "@/lib/blockchain";

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { subscriptionId, username, password, link } = await req.json();

        if (!subscriptionId) {
            return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 });
        }

        const subscription = await prisma.ottSubscription.findUnique({
            where: { id: subscriptionId },
            include: { paymentIntent: true }
        });

        if (!subscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        // 1. Mark Subscription as ACTIVE and store credentials
        await prisma.ottSubscription.update({
            where: { id: subscriptionId },
            data: {
                username,
                password,
                link,
                status: 'ACTIVE'
            }
        });

        // 2. If there's a linked payment, finalize it now
        if (subscription.paymentIntent && subscription.paymentIntent.status !== 'VERIFIED') {
            await finalizePayment(
                subscription.paymentIntent.id,
                subscription.paymentIntent.txHash || 'ADMIN_MANUAL',
                Number(subscription.paymentIntent.amount)
            );
        }

        return NextResponse.json({ message: "Subscription approved and activated" });
    } catch (error: any) {
        console.error("Admin approval error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
