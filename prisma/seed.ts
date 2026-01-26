import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting System Seed ---');

    // 1. Seed Plan 1 (600 USDT)
    const plan1 = await prisma.plan.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: "Standard Plan",
            price: 600,
            levelCount: 10,
            levelPercentages: JSON.stringify({
                L1: 10,
                L2: 5,
                L3: 1,
                L4_10: 0.5
            })
        }
    });
    console.log('✔ Plan 1 Seeded');

    // 2. Seed AutoPool 1
    const pool1 = await prisma.autoPool.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: "Global Pool 1",
            entryFee: 100,
            matrixWidth: 3,
            matrixDepth: 3,
            reward: 500
        }
    });
    console.log('✔ AutoPool 1 Seeded');

    // 3. Seed Default App Config
    const config = await prisma.appConfig.upsert({
        where: { key: 'PLATFORM_CONFIG' },
        update: {},
        create: {
            key: 'PLATFORM_CONFIG',
            value: JSON.stringify({
                treasuryAddress: process.env.TREASURY_WALLET_ADDRESS || '0xYourTreasuryWalletAddressHere',
                planPrice: '600',
                L1: 10,
                L2: 5,
                L3: 1,
                L4_10: 0.5,
                poolEntry: 100,
                poolReward: 500
            })
        }
    });
    console.log('✔ Platform Config Seeded');

    console.log('--- Seed Complete! ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
