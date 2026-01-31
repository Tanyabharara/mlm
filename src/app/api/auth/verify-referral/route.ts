import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "No code provided" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { referralCode: code.toUpperCase() },
            select: {
                id: true,
                name: true,
                referralCode: true
            }
        });

        if (!user) {
            return NextResponse.json({ valid: false }, { status: 404 });
        }

        return NextResponse.json({ valid: true, name: user.name });
    } catch (error: any) {
        console.error("[API Verify Referral] Error:", error.message);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
