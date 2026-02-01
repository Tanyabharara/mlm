import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    // Pool 1: $1 (₹100)
    await prisma.autoPool.upsert({
        where: { id: 1 },
        update: {
            name: "Auto Pool 1",
            entryFee: 1.00,
            reward: 10.20
        },
        create: {
            id: 1,
            name: "Auto Pool 1",
            entryFee: 1.00,
            matrixWidth: 3,
            matrixDepth: 3,
            reward: 10.20
        }
    });

    // Pool 2: $10 (₹1000)
    await prisma.autoPool.upsert({
        where: { id: 2 },
        update: {
            name: "Auto Pool 2",
            entryFee: 10.00,
            reward: 102.00
        },
        create: {
            id: 2,
            name: "Auto Pool 2",
            entryFee: 10.00,
            matrixWidth: 3,
            matrixDepth: 3,
            reward: 102.00
        }
    });

    // Pool 3: $100 (₹10000)
    await prisma.autoPool.upsert({
        where: { id: 3 },
        update: {
            name: "Auto Pool 3",
            entryFee: 100.00,
            reward: 1020.00
        },
        create: {
            id: 3,
            name: "Auto Pool 3",
            entryFee: 100.00,
            matrixWidth: 3,
            matrixDepth: 3,
            reward: 1020.00
        }
    });

    console.log("Auto Pools updated to Dollar values successfully!");
    const pools = await prisma.autoPool.findMany();
    console.log(JSON.stringify(pools, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
