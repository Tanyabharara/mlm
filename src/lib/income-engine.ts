import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "./prisma";

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

  // 1. Distribute Direct Income based on Plan percentage config
  const planPrice = Number(plan.price);
  // Traditional rule: 90% goes to network, 10% stays in pool/admin
  const networkWorkingAmount = planPrice * 0.9;

  await distributeNetworkRewards(user.id, networkWorkingAmount);

  // 2. Enter Auto Pool (Pool ID 1 for now)
  // Standard entry fee logic (usually from the remaining 10%)
  await enterAutoPool(user.id, 1);
}

async function distributeNetworkRewards(userId: number, amount: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { referredBy: true }
  });

  if (!user || !user.referredById) return;

  const config: Record<number, number> = {
    1: 0.10,
    2: 0.05,
    3: 0.01,
    4: 0.005, 5: 0.005, 6: 0.005, 7: 0.005, 8: 0.005, 9: 0.005, 10: 0.005
  };

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

    const upline = await prisma.user.findUnique({
      where: { id: currentUplineId },
      select: { referredById: true }
    });
    currentUplineId = upline?.referredById || null;
    level++;
  }
}

async function enterAutoPool(userId: number, poolId: number) {
  const pool = await prisma.autoPool.findUnique({ where: { id: poolId } });
  if (!pool) return;

  const entries = await prisma.autoPoolEntry.findMany({
    where: { poolId: poolId },
    include: {
      _count: { select: { children: true } }
    },
    orderBy: { id: 'asc' }
  });

  // Find the first entry that isn't full (3x3 logic)
  const parentEntry = entries.find(e => e._count.children < (pool.matrixWidth || 3));

  const newEntry = await prisma.autoPoolEntry.create({
    data: {
      userId: userId,
      poolId: poolId,
      parentId: parentEntry?.id || null,
      level: parentEntry ? parentEntry.level + 1 : 1
    }
  });

  if (parentEntry) {
    await checkPoolCompletion(parentEntry.id);
  }
}

async function checkPoolCompletion(entryId: number) {
  const entry = await prisma.autoPoolEntry.findUnique({
    where: { id: entryId },
    include: {
      pool: true,
      children: {
        include: {
          children: {
            include: { children: true }
          }
        }
      }
    }
  });

  if (!entry || entry.isCompleted) return;

  // Level 1: 3
  // Level 2: 9
  // Level 3: 27
  const countL1 = entry.children.length;
  let countL2 = 0;
  let countL3 = 0;

  entry.children.forEach(c1 => {
    countL2 += c1.children.length;
    c1.children.forEach(c2 => {
      countL3 += c2.children.length;
    });
  });

  // Full 3x3x3 = 39 members total. 
  // Requirements say "AutoPool Progress" often visualizes the 27 in L3.
  if (countL1 >= 3 && countL2 >= 9 && countL3 >= 27) {
    await prisma.autoPoolEntry.update({
      where: { id: entryId },
      data: { isCompleted: true, completedAt: new Date() }
    });

    const reward = Number(entry.pool.reward);

    await prisma.user.update({
      where: { id: entry.userId },
      data: { walletBalance: { increment: reward } }
    });

    await prisma.transaction.create({
      data: {
        userId: entry.userId,
        amount: new Prisma.Decimal(reward.toFixed(2)),
        type: "CREDIT",
        category: "POOL_INCOME",
        description: `Auto Pool ${entry.pool.name} completed! Reward: $${reward.toFixed(2)}`
      }
    });

    // Automatic re-entry
    await enterAutoPool(entry.userId, entry.poolId);
  }
}
