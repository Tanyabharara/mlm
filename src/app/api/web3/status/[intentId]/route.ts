import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { intentId: string } }
) {
    try {
        const { intentId } = params;

        const intent = await prisma.paymentIntent.findUnique({
            where: { id: intentId },
        });

        if (!intent) {
            return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: intent.status,
            confirmations: intent.confirmations,
            txHash: intent.txHash
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// This route is used by the frontend status page to poll for updates
