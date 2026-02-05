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

  // Fetch Percentages from Admin Config
  const platformConfig = await getAppConfig("PLATFORM_CONFIG");
  const pConfig = platformConfig ? JSON.parse(platformConfig.value) : {};

  const defaultPercentages: Record<number, number> = {
    1: (Number(pConfig.L1) / 100) || 0.1,    // Default 10%
    2: (Number(pConfig.L2) / 100) || 0.05,   // Default 5%
    3: (Number(pConfig.L3) / 100) || 0.025,  // Default 2.5%
    4: (Number(pConfig.L4_10) / 100) || 0.005,  // Default 0.5%
    5: (Number(pConfig.L4_10) / 100) || 0.005,
    6: (Number(pConfig.L4_10) / 100) || 0.005,
    7: (Number(pConfig.L4_10) / 100) || 0.005,
    8: (Number(pConfig.L4_10) / 100) || 0.005,
    9: (Number(pConfig.L4_10) / 100) || 0.005,
    10: (Number(pConfig.L4_10) / 100) || 0.005,
  };
  const config = defaultPercentages;

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
