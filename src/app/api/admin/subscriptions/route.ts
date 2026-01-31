import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Users who have at least one purchase but no active OTT subscription
        const users = await prisma.user.findMany({
            where: {
                planId: { not: null },
                ottSubscriptions: {
                    none: {
                        status: "ACTIVE"
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                planId: true,
                plan: true,
                createdAt: true,
                ottSubscriptions: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

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

        // Create or Update OTT Subscription
        const subscription = await prisma.ottSubscription.create({
            data: {
                userId,
                platform,
                username,
                password,
                link,
                status: "ACTIVE"
            }
        });

        return NextResponse.json({ message: "Subscription assigned successfully", subscription });
    } catch (error: any) {
        console.error("[API Admin Subscriptions POST] Error:", error.message);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
