import { prisma } from "@/lib/db";
import { distributeIncome } from "@/lib/income-engine";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { uid, planId } = await req.json();
        
        const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                planId: Number(planId)
            }
        });
        
        await prisma.user.update({
            where: { id: user.id },
            data: { planId: Number(planId) }
        });
        
        await distributeIncome(purchase.id);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
    }
}
