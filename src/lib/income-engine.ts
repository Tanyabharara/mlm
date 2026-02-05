import { enterAutoPool } from "./new-income-engine";
import { processUserMilestones } from "./milestone-engine";
import {
  getPurchase,
  getUserById,
  getPlan,
  getAppConfig,
  updateWalletBalance,
  createTransaction,
} from "./firebase-db";

export async function distributeIncome(purchaseId: string) {
  const purchase: any = await getPurchase(purchaseId);
  if (!purchase) return;

  const user: any = await getUserById(purchase.userId);
  const plan: any = await getPlan(purchase.planId);
  if (!user || !plan) return;

  const planPrice = Number(plan.price);
  const networkWorkingAmount = planPrice;

  // Level income distribution (10 levels)
  await distributeNetworkRewards(user.id, networkWorkingAmount);

  await enterAutoPool(user.id, "1");

  // Check milestones for the immediate referrer
  if (user.referredById) {
    await processUserMilestones(user.referredById);
  }
}

async function distributeNetworkRewards(userId: string, amount: number) {
  const user: any = await getUserById(userId);
  if (!user || !user.referredById) return;

  const incomeConfig = await getAppConfig("LEVEL_INCOME_CONFIG");
  const defaultPercentages: Record<number, number> = {
    1: 0.1,    // 10%
    2: 0.05,   // 5%
    3: 0.025,  // 2.5%
    4: 0.005,  // 0.5%
    5: 0.005,  // 0.5%
    6: 0.005,  // 0.5%
    7: 0.005,  // 0.5%
    8: 0.005,  // 0.5%
    9: 0.005,  // 0.5%
    10: 0.005, // 0.5%
  };
  const config: Record<number, number> = incomeConfig ? JSON.parse(incomeConfig.value) : defaultPercentages;

  let currentUplineId: string | null = user.referredById;
  let level = 1;

  while (currentUplineId && level <= 10) {
    const percentage = config[level] || 0;
    if (percentage > 0) {
      const commission = amount * percentage;
      await updateWalletBalance(currentUplineId, commission, "increment");
      await createTransaction({
        userId: currentUplineId,
        amount: commission,
        type: "CREDIT",
        category: "DIRECT_INCOME",
        description: `Level ${level} income from ${user.name || "user"} ($${commission.toFixed(2)})`,
      });
    }

    const upline: any = await getUserById(currentUplineId);
    currentUplineId = upline?.referredById || null;
    level++;
  }
}
