import { getConsumer, getProducer, TOPICS } from "../lib/kafka";
import {
  getUserById,
  updateUser,
  createPurchase,
  getPlans,
} from "../lib/firebase-db";

export async function startPlanActivationConsumer() {
  const consumer = await getConsumer("plan-activation-group");
  const producer = await getProducer();

  await consumer.subscribe({ topic: TOPICS.PAYMENT_CONFIRMED, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const { paymentIntentId, userId, amount } = JSON.parse(message.value.toString());

      try {
        console.log(`[PlanActivation] Processing order for User ${userId}...`);

        const user: any = await getUserById(userId);

        if (user?.planId) {
          console.log(`[PlanActivation] User ${userId} already has an active plan. Skipping.`);
          return;
        }

        const plans = await getPlans();
        const firstPlan = plans[0];
        if (!firstPlan) {
          console.warn("[PlanActivation] No plan found.");
          return;
        }

        await updateUser(userId, { planId: firstPlan.id });
        const purchase = await createPurchase({
          userId,
          planId: firstPlan.id,
        });

        await producer.send({
          topic: TOPICS.PLAN_ACTIVATED,
          messages: [
            {
              key: userId,
              value: JSON.stringify({ userId, planId: firstPlan.id, amount: 600 }),
            },
          ],
        });

        console.log(`[PlanActivation] User ${userId} activated successfully.`);
      } catch (error: any) {
        console.error(`[PlanActivation] Error processing user ${userId}:`, error.message);
        throw error;
      }
    },
  });
}
