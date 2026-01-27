import { getConsumer, getProducer, TOPICS } from '../lib/kafka';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function startIncomeCalculationConsumer() {
    const consumer = await getConsumer('income-calc-group');
    const producer = await getProducer();

    await consumer.subscribe({ topic: TOPICS.PLAN_ACTIVATED, fromBeginning: true });

    const levelRewards: Record<number, number> = {
        1: 0.10, // 10%
        2: 0.05, // 5%
        3: 0.01, // 1%
    };
    for (let i = 4; i <= 10; i++) levelRewards[i] = 0.005;

    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) return;

            const { userId, amount } = JSON.parse(message.value.toString());

            try {
                console.log(`[IncomeCalc] Calculating rewards for User ${userId}...`);

                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    include: { referredBy: true }
                });

                if (!user || !user.referredById) {
                    console.log(`[IncomeCalc] No upline for User ${userId}. Done.`);
                    return;
                }

                const workingAmount = 500; // From 600 total, 500 is for working income distribution
                let currentUplineId: number | null = user.referredById;
                let level = 1;
                let totalDistributed = 0;

                while (currentUplineId && level <= 10) {
                    const rewardPercentage = levelRewards[level] || 0;
                    if (rewardPercentage > 0) {
                        const commission = workingAmount * rewardPercentage;

                        // Emit Income Calculated event (one for each level or aggregated)
                        // We'll emit one event to trigger Ledger credit for this specific recipient
                        await producer.send({
                            topic: TOPICS.INCOME_CALCULATED,
                            messages: [
                                {
                                    key: currentUplineId.toString(),
                                    value: JSON.stringify({
                                        userId: currentUplineId,
                                        sourceUserId: userId,
                                        amount: commission,
                                        category: 'DIRECT_INCOME',
                                        description: `Level ${level} referral income from ${user.name || "user"}`
                                    }),
                                },
                            ],
                        });

                        totalDistributed += commission;

                        const upline: { referredById: number | null } | null = await prisma.user.findUnique({ 
                            where: { id: currentUplineId },
                            select: { referredById: true }
                        });
                        currentUplineId = upline?.referredById || null;
                    } else {
                        break;
                    }
                    level++;
                }

                console.log(`[IncomeCalc] Distributed $${totalDistributed} across levels for User ${userId}`);
            } catch (error: any) {
                console.error(`[IncomeCalc] Error for user ${userId}:`, error.message);
                throw error;
            }
        },
    });
}
