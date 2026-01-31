import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "./prisma";
import { enterAutoPool } from "./new-income-engine";

// High-level wrapper for serverless execution
export async function distributeIncome(purchaseId: number) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: { include: { referredBy: true } },
      plan: true
    }
  });

  if (!purchase) return;

  const user = purchase.user;
  const plan = purchase.plan;

  // 1. Distribute Direct Income (using original logic or updated one?)
  // Let's use the updated logic for consistency if desired, or keep this one.
  // The user didn't ask to change direct income again, but let's stick to the config.
  const planPrice = Number(plan.price);
  const networkWorkingAmount = planPrice * 0.9;

  await distributeNetworkRewards(user.id, networkWorkingAmount);

  // 2. Enter Auto Pool (Pool ID 1 for now)
  await enterAutoPool(user.id, 1);
}

async function distributeNetworkRewards(userId: number, amount: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { referredBy: true }
  });

  if (!user || !user.referredById) return;

  // Fetch dynamic config from DB
  const incomeConfig = await prisma.appConfig.findUnique({
    where: { key: 'LEVEL_INCOME_CONFIG' }
  });

  const defaultPercentages: Record<number, number> = {
    1: 0.10, 2: 0.05, 3: 0.01,
    4: 0.005, 5: 0.005, 6: 0.005, 7: 0.005, 8: 0.005, 9: 0.005, 10: 0.005
  };

  const config: Record<number, number> = incomeConfig ? JSON.parse(incomeConfig.value) : defaultPercentages;

  let currentUplineId: number | null = user.referredById;
  let level = 1;

  while (currentUplineId && level <= 10) {
    const percentage = config[level] || 0;
    if (percentage > 0) {
      const commission = amount * percentage;

      // Atomic Update
      await prisma.user.update({
        where: { id: currentUplineId },
        data: { walletBalance: { increment: commission } }
      });

      // Ledger Entry
      await prisma.transaction.create({
        data: {
          userId: currentUplineId,
          amount: new Prisma.Decimal(commission.toFixed(2)),
          type: "CREDIT",
          category: "DIRECT_INCOME",
          description: `Level ${level} income from ${user.name || "user"} ($${commission.toFixed(2)})`
        }
      });
    }

    const upline: { referredById: number | null } | null = await prisma.user.findUnique({
      where: { id: currentUplineId },
      select: { referredById: true }
    });
    currentUplineId = upline?.referredById || null;
    level++;
  }
}
