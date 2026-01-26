import { getConsumer, TOPICS } from '../lib/kafka';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function startWalletLedgerConsumer() {
    const consumer = await getConsumer('wallet-ledger-group');

    await consumer.subscribe({
        topics: [TOPICS.INCOME_CALCULATED, TOPICS.AUTOPOOL_UPDATED, TOPICS.PAYMENT_CONFIRMED],
        fromBeginning: true
    });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            if (!message.value) return;

            const data = JSON.parse(message.value.toString());

            try {
                if (topic === TOPICS.INCOME_CALCULATED) {
                    const { userId, amount, category, description } = data;
                    await creditWallet(userId, amount, category, description);
                }
                else if (topic === TOPICS.AUTOPOOL_UPDATED && data.action === 'CREDIT_REWARD') {
                    const { userId, amount, poolName } = data;
                    await creditWallet(userId, amount, 'POOL_INCOME', `Auto Pool ${poolName} completion reward`);
                }
                else if (topic === TOPICS.PAYMENT_CONFIRMED) {
                    // New: Direct payment confirmation - Calculate and credit Admin Profit
                    await handleAdminProfit(data);
                }
            } catch (error: any) {
                console.error(`[WalletLedger] Error updating wallet for topic ${topic}:`, error.message);
                throw error;
            }
        },
    });
}

async function handleAdminProfit(data: any) {
    const { amount, paymentIntentId, userId } = data;

    // 1. Find the platform owner (User with ADMIN role)
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        orderBy: { id: 'asc' } // Usually the first created admin
    });

    if (!admin) {
        console.warn("[WalletLedger] No Admin user found to credit profit.");
        return;
    }

    // 2. Fetch platform config to understand distribution
    const configData = await prisma.appConfig.findUnique({ where: { key: 'PLATFORM_CONFIG' } });
    const config = configData ? JSON.parse(configData.value) : { L1: 10, L2: 5, L3: 1, L4_10: 0.5, poolEntry: 100 };

    // 3. Calculate distributed commissions
    const totalCommissionsPercent =
        parseFloat(config.L1) +
        parseFloat(config.L2) +
        parseFloat(config.L3) +
        (parseFloat(config.L4_10) * 7);

    const workingAmount = parseFloat(amount) - parseFloat(config.poolEntry);
    const distributedAmount = (workingAmount * totalCommissionsPercent) / 100;

    // Admin Profit = Total Paid - (Commissions Distributed + AutoPool Entry portion)
    const profit = parseFloat(amount) - distributedAmount - parseFloat(config.poolEntry);

    console.log(`[WalletLedger] Crediting Admin Profit: $${profit.toFixed(2)} to Admin User ${admin.id}`);

    await creditWallet(
        admin.id,
        profit,
        'ADMIN_PROFIT',
        `Company profit from User ${userId} purchase (Intent: ${paymentIntentId})`
    );
}

async function creditWallet(userId: number, amount: number, category: string, description: string) {
    console.log(`[WalletLedger] Crediting $${amount} to User ${userId} (${category})...`);

    await prisma.$transaction([
        // 1. Update user balance
        prisma.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: amount } }
        }),
        // 2. Create ledger transaction for history
        prisma.transaction.create({
            data: {
                userId: userId,
                amount: amount,
                type: 'CREDIT',
                category: category,
                description: description,
            }
        })
    ]);

    console.log(`[WalletLedger] Ledger sync complete for User ${userId}.`);
}
