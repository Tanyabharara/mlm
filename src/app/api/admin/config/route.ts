import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { adminAuth } from '@/lib/firebase-db';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        const user = await prisma.user.findUnique({
            where: { firebaseUid },
        });

        if (user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        const user = await prisma.user.findUnique({
            where: { firebaseUid },
        });

        if (user?.role !== 'ADMIN') {
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
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
