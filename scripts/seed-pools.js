const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Upserting Auto Pools...');

    // Auto Pool 1
    await prisma.autoPool.upsert({
        where: { id: 1 },
        update: {
            name: 'Auto Pool 1',
            entryFee: 100,
            reward: 1020, // Sum of 10% + 20% + 30% per level
            matrixWidth: 3,
            matrixDepth: 3
        },
        create: {
            id: 1,
            name: 'Auto Pool 1',
            entryFee: 100,
            reward: 1020,
            matrixWidth: 3,
            matrixDepth: 3
        }
    });

    // Auto Pool 2
    await prisma.autoPool.upsert({
        where: { id: 2 },
        update: {
            name: 'Auto Pool 2',
            entryFee: 1000,
            reward: 10200,
            matrixWidth: 3,
            matrixDepth: 3
        },
        create: {
            id: 2,
            name: 'Auto Pool 2',
            entryFee: 1000,
            reward: 10200,
            matrixWidth: 3,
            matrixDepth: 3
        }
    });

    // Auto Pool 3
    await prisma.autoPool.upsert({
        where: { id: 3 },
        update: {
            name: 'Auto Pool 3',
            entryFee: 10000,
            reward: 102000,
            matrixWidth: 3,
            matrixDepth: 3
        },
        create: {
            id: 3,
            name: 'Auto Pool 3',
            entryFee: 10000,
            reward: 102000,
            matrixWidth: 3,
            matrixDepth: 3
        }
    });

    console.log('Auto Pools synced successfully.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
