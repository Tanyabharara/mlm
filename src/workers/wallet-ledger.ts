import { getConsumer, TOPICS } from "../lib/kafka";
import {
  getFirstAdminUser,
  getAppConfig,
  updateWalletBalance,
  createTransaction,
} from "../lib/firebase-db";

export async function startWalletLedgerConsumer() {
  const consumer = await getConsumer("wallet-ledger-group");

  await consumer.subscribe({
    topics: [TOPICS.INCOME_CALCULATED, TOPICS.AUTOPOOL_UPDATED, TOPICS.PAYMENT_CONFIRMED],
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;

      const data = JSON.parse(message.value.toString());

      try {
        if (topic === TOPICS.INCOME_CALCULATED) {
          const { userId, amount, category, description } = data;
          await creditWallet(userId, amount, category, description);
        } else if (topic === TOPICS.AUTOPOOL_UPDATED && data.action === "CREDIT_REWARD") {
          const { userId, amount, poolName } = data;
          await creditWallet(userId, amount, "POOL_INCOME", `Auto Pool ${poolName} completion reward`);
        } else if (topic === TOPICS.PAYMENT_CONFIRMED) {
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

  const admin = await getFirstAdminUser();
  if (!admin) {
    console.warn("[WalletLedger] No Admin user found to credit profit.");
    return;
  }

  const configDoc = await getAppConfig("PLATFORM_CONFIG");
  const config = configDoc ? JSON.parse(configDoc.value) : { L1: 10, L2: 5, L3: 1, L4_10: 0.5, poolEntry: 100 };

  const totalCommissionsPercent =
    parseFloat(config.L1) +
    parseFloat(config.L2) +
    parseFloat(config.L3) +
    parseFloat(config.L4_10) * 7;

  const workingAmount = parseFloat(amount) - parseFloat(config.poolEntry);
  const distributedAmount = (workingAmount * totalCommissionsPercent) / 100;
  const profit = parseFloat(amount) - distributedAmount - parseFloat(config.poolEntry);

  console.log(`[WalletLedger] Crediting Admin Profit: $${profit.toFixed(2)} to Admin User ${admin.id}`);

  await creditWallet(
    admin.id,
    profit,
    "ADMIN_PROFIT",
    `Company profit from User ${userId} purchase (Intent: ${paymentIntentId})`
  );
}

async function creditWallet(userId: string, amount: number, category: string, description: string) {
  console.log(`[WalletLedger] Crediting $${amount} to User ${userId} (${category})...`);

  await updateWalletBalance(userId, amount, "increment");
  await createTransaction({
    userId,
    amount,
    type: "CREDIT",
    category,
    description,
  });

  console.log(`[WalletLedger] Ledger sync complete for User ${userId}.`);
}
