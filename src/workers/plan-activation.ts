import { getConsumer, getProducer, TOPICS } from '../lib/kafka';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function startPlanActivationConsumer() {
    const consumer = await getConsumer('plan-activation-group');
    const producer = await getProducer();

    await consumer.subscribe({ topic: TOPICS.PAYMENT_CONFIRMED, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) return;

            const { paymentIntentId, userId, amount } = JSON.parse(message.value.toString());

            try {
                console.log(`[PlanActivation] Processing order for User ${userId}...`);

                // Use transaction to ensure idempotency and atomicity
                await prisma.$transaction(async (tx) => {
                    const user = await tx.user.findUnique({ where: { id: userId } });

                    if (user?.planId) {
                        console.log(`[PlanActivation] User ${userId} already has an active plan. Skipping.`);
                        return;
                    }

                    // Activate Plan 1 (600 USDT)
                    await tx.user.update({
                        where: { id: userId },
                        data: { planId: 1 }
                    });

                    await tx.purchase.create({
                        data: {
                            userId: userId,
                            planId: 1,
                        }
                    });

                    // Emit next event
                    await producer.send({
                        topic: TOPICS.PLAN_ACTIVATED,
                        messages: [
                            {
                                key: userId.toString(),
                                value: JSON.stringify({ userId, planId: 1, amount: 600 }),
                            },
                        ],
                    });
                });

                console.log(`[PlanActivation] User ${userId} activated successfully.`);
            } catch (error: any) {
                console.error(`[PlanActivation] Error processing user ${userId}:`, error.message);
                // Kafka will automatically retry based on configuration
                throw error;
            }
        },
    });
}
