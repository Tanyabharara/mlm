import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const config = await prisma.appConfig.findUnique({
            where: { key: 'PLATFORM_CONFIG' },
        });

        if (!config) {
            // Fallback defaults
            return NextResponse.json({
                config: {
                    treasuryAddress: process.env.TREASURY_WALLET_ADDRESS || '0xYourTreasuryWalletAddressHere',
                    planPrice: '600'
                }
            });
        }

        const { treasuryAddress, planPrice } = JSON.parse(config.value);

        return NextResponse.json({ config: { treasuryAddress, planPrice } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
