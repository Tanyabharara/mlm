import { getConsumer, getProducer, TOPICS } from '../lib/kafka';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function startAutoPoolConsumer() {
    const consumer = await getConsumer('autopool-group');
    const producer = await getProducer();

    await consumer.subscribe({ topic: TOPICS.PLAN_ACTIVATED, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) return;

            const { userId } = JSON.parse(message.value.toString());

            try {
                console.log(`[AutoPool] Entering User ${userId} into Pool 1...`);

                const pool = await prisma.autoPool.findFirst({ where: { id: 1 } });
                if (!pool) throw new Error("Pool 1 configuration missing");

                // Use transaction for FIFO concurrency safety
                await prisma.$transaction(async (tx) => {
                    // Find first available parent in FIFO sequence
                    const entries = await tx.autoPoolEntry.findMany({
                        where: { poolId: 1 },
                        include: { _count: { select: { children: true } } },
                        orderBy: { id: 'asc' }
                    });

                    const parentEntry = entries.find(e => e._count.children < pool.matrixWidth);

                    const newEntry = await tx.autoPoolEntry.create({
                        data: {
                            userId: userId,
                            poolId: 1,
                            parentId: parentEntry?.id || null,
                            level: parentEntry ? parentEntry.level + 1 : 1
                        }
                    });

                    if (parentEntry) {
                        // Emit event to check for completion reward
                        await producer.send({
                            topic: TOPICS.AUTOPOOL_UPDATED,
                            messages: [
                                {
                                    key: parentEntry.userId.toString(),
                                    value: JSON.stringify({
                                        entryId: parentEntry.id,
                                        userId: parentEntry.userId,
                                        poolId: 1,
                                        action: 'CHECK_COMPLETION'
                                    }),
                                },
                            ],
                        });
                    }
                });

            } catch (error: any) {
                console.error(`[AutoPool] Error for user ${userId}:`, error.message);
                throw error;
            }
        },
    });
}
// Note: Logic for distributing rewards on pool completion would be another consumer of AUTOPOOL_UPDATED or part of this logic.
