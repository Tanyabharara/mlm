import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPools() {
    const pools = [
        { name: "Pool 1", entryFee: 100, reward: 500, matrixWidth: 3, matrixDepth: 3 },
        { name: "Pool 2", entryFee: 1000, reward: 5000, matrixWidth: 3, matrixDepth: 3 },
        { name: "Pool 3", entryFee: 5000, reward: 25000, matrixWidth: 3, matrixDepth: 3 },
    ];

    for (const pool of pools) {
        await prisma.autoPool.upsert({
            where: { id: pools.indexOf(pool) + 1 }, // Note: id might not match index
            update: {},
            create: {
                name: pool.name,
                entryFee: pool.entryFee,
                reward: pool.reward,
                matrixWidth: pool.matrixWidth,
                matrixDepth: pool.matrixDepth,
            },
        });
    }

    // Seed Plan 1
    await prisma.plan.upsert({
        where: { id: 1 },
        update: { price: 600 },
        create: {
            id: 1,
            name: "Premium Starter",
            price: 600,
            levelCount: 10,
            levelPercentages: JSON.stringify({
                "1": 0.10,
                "2": 0.05,
                "3": 0.01,
                "4-10": 0.005
            }),
        },
    });

    // Initialize App Config for percentages
    const defaultConfig = {
        level_percentages: {
            "1": 0.10,
            "2": 0.05,
            "3": 0.01,
            "4": 0.005,
            "5": 0.005,
            "6": 0.005,
            "7": 0.005,
            "8": 0.005,
            "9": 0.005,
            "10": 0.005,
        }
    };

    await prisma.appConfig.upsert({
        where: { key: "MLM_CONFIG" },
        update: {},
        create: {
            key: "MLM_CONFIG",
            value: JSON.stringify(defaultConfig),
        },
    });

    console.log("Pools and Config seeded successfully.");
}

seedPools()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
