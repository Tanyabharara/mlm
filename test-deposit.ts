import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: { contains: 'taro' } }
    });

    if (!user) {
        console.log("No user found");
        return;
    }

    console.log(`Current Balance for ${user.name}: ${user.walletBalance}`);

    // Simulate a 500 deposit
    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: { increment: 500 } }
    });

    console.log(`Updated Balance for ${user.name}: ${updated.walletBalance}`);

    // Check if we can create a transaction
    const tx = await prisma.transaction.create({
        data: {
            userId: user.id,
            amount: 500,
            type: 'CREDIT',
            category: 'DEPOSIT',
            description: 'Test manual deposit'
        }
    });
    console.log(`Test Transaction Created: ${tx.id}`);
}

main()
    .catch(e => console.error("Error during test:", e))
    .finally(() => prisma.$disconnect());
