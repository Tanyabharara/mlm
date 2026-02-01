import { getConsumer, getProducer, TOPICS } from "../lib/kafka";
import {
  getAutoPool,
  getAutoPoolEntriesByPool,
  countAutoPoolEntryChildren,
  createAutoPoolEntry,
} from "../lib/firebase-db";

export async function startAutoPoolConsumer() {
  const consumer = await getConsumer("autopool-group");
  const producer = await getProducer();

  await consumer.subscribe({ topic: TOPICS.PLAN_ACTIVATED, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const { userId } = JSON.parse(message.value.toString());

      try {
        console.log(`[AutoPool] Entering User ${userId} into Pool 1...`);

        const pool: any = await getAutoPool("1");
        if (!pool) throw new Error("Pool 1 configuration missing");

        const entries = await getAutoPoolEntriesByPool("1");
        const matrixWidth = Number(pool.matrixWidth) || 3;

        let parentEntry: any = null;
        for (const e of entries) {
          const childCount = await countAutoPoolEntryChildren(e.id);
          if (childCount < matrixWidth) {
            parentEntry = e;
            break;
          }
        }

        const newEntry = await createAutoPoolEntry({
          userId,
          poolId: "1",
          parentId: parentEntry?.id || null,
          level: parentEntry ? (Number(parentEntry.level) || 0) + 1 : 1,
        });

        if (parentEntry) {
          await producer.send({
            topic: TOPICS.AUTOPOOL_UPDATED,
            messages: [
              {
                key: parentEntry.userId,
                value: JSON.stringify({
                  entryId: parentEntry.id,
                  userId: parentEntry.userId,
                  poolId: "1",
                  action: "CHECK_COMPLETION",
                }),
              },
            ],
          });
        }
      } catch (error: any) {
        console.error(`[AutoPool] Error for user ${userId}:`, error.message);
        throw error;
      }
    },
  });
}
