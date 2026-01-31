import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const verifiedUid = await verifyAuthToken(req);

        if (!verifiedUid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { firebaseUid: verifiedUid },
            include: {
                ottSubscriptions: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ subscriptions: user.ottSubscriptions });
    } catch (error: any) {
        console.error("[API User OTT] Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
