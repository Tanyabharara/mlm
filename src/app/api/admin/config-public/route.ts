import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

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

        const parsed = JSON.parse(config.value);
        const treasuryAddress = parsed.treasuryAddress || process.env.TREASURY_WALLET_ADDRESS || '0xYourTreasuryWalletAddressHere';
        const planPrice = parsed.planPrice;

        return NextResponse.json({ config: { treasuryAddress, planPrice } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
