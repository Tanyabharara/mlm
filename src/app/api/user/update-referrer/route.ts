import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { referrerCode } = await req.json();
        const verifiedUid = await verifyAuthToken(req);

        if (!verifiedUid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { firebaseUid: verifiedUid },
            include: { referredBy: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only allow changing if current referrer is an ADMIN or null
        // And if they haven't purchased a plan yet (to prevent tree restructuring after payment)
        if (user.planId) {
            return NextResponse.json({ error: "Cannot change referrer after plan activation" }, { status: 400 });
        }

        const newReferrer = await prisma.user.findUnique({
            where: { referralCode: referrerCode.toUpperCase() }
        });

        if (!newReferrer) {
            return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
        }

        if (newReferrer.id === user.id) {
            return NextResponse.json({ error: "You cannot refer yourself" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { referredById: newReferrer.id },
            include: { referredBy: true }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error: any) {
        console.error("[API Update Referrer] Error:", error.message);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
