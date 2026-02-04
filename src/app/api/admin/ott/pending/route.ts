
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAllOttSubscriptions, getUserById } from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const subscriptions = await getAllOttSubscriptions(100);
        const pendingRequests = await Promise.all(
            subscriptions
                .filter((s: any) => s.status === "PENDING_APPROVAL")
                .map(async (s: any) => {
                    const user = await getUserById(s.userId);
                    return {
                        ...s,
                        user: user ? { name: user.name, email: user.email } : null
                    };
                })
        );

        return NextResponse.json({ requests: pendingRequests });
    } catch (error: any) {
        console.error("[API Admin OTT Pending] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
