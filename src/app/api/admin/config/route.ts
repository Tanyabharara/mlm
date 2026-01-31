import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await prisma.appConfig.findUnique({
            where: { key: 'PLATFORM_CONFIG' },
        });

        return NextResponse.json({ config: config ? JSON.parse(config.value) : {} });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();

        await prisma.appConfig.upsert({
            where: { key: 'PLATFORM_CONFIG' },
            update: { value: JSON.stringify(body) },
            create: { key: 'PLATFORM_CONFIG', value: JSON.stringify(body) },
        });

        // Also update Plan 1 price if it's in the config
        if (body.planPrice) {
            await prisma.plan.update({
                where: { id: 1 },
                data: { price: parseFloat(body.planPrice) }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[API Admin Config] Error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
