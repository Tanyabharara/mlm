import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function distributeIncome(purchaseId: number) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: { include: { referredBy: true } },
    }
  });

  if (!purchase) return;

  const user = purchase.user;

  // 1. Distribute Direct Income (from $5 working amount)
  // Logic: L1: 10%, L2: 5%, L3: 1%, L4-10: 0.5%
  const workingAmount = 5;
  await distributeDirect(user.id, workingAmount);

  // 2. Enter Auto Pool ($1)
  // We use Pool 1 for the default $6 plan
  await enterAutoPool(user.id, 1);
}

async function distributeDirect(userId: number, amount: number) {
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
      await prisma.user.update({
        where: { id: currentUplineId },
        data: { walletBalance: { increment: commission } }
      });

      await prisma.transaction.create({
        data: {
          userId: currentUplineId,
          amount: new Prisma.Decimal(commission),
          type: "CREDIT",
          category: "DIRECT_INCOME",
          description: `Level ${level} income from ${user.name || "user"} ($${commission.toFixed(2)})`
        }
      });
    }

    const upline: any = await prisma.user.findUnique({ where: { id: currentUplineId } });
    currentUplineId = upline?.referredById || null;
    level++;
  }
}

async function enterAutoPool(userId: number, poolId: number) {
  const pool = await prisma.autoPool.findUnique({ where: { id: poolId } });
  if (!pool) return;

  const entries = await prisma.autoPoolEntry.findMany({
    where: { poolId: poolId },
    include: { _count: { select: { children: true } } },
    orderBy: { id: 'asc' }
  });

  // Find the first entry that doesn't have a full matrix width
  const parentEntry = entries.find(e => e._count.children < pool.matrixWidth);

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
  // We need to check if the 3x3 matrix under this entry is full.
  // 3 across, 3 deep.
  const entry = await prisma.autoPoolEntry.findUnique({
    where: { id: entryId },
    include: {
      pool: true,
      children: {
        include: {
          children: {
            include: {
              children: true
            }
          }
        }
      }
    }
  });

  if (!entry || entry.isCompleted) return;

  const countL1 = entry.children.length;
  let countL2 = 0;
  let countL3 = 0;

  entry.children.forEach((c1: any) => {
    countL2 += c1.children.length;
    c1.children.forEach((c2: any) => {
      countL3 += c2.children.length;
    });
  });

  // Completion criteria: L1=3, L2=9, L3=27
  if (countL1 >= 3 && countL2 >= 9 && countL3 >= 27) {
    await prisma.autoPoolEntry.update({
      where: { id: entryId },
      data: { isCompleted: true, completedAt: new Date() }
    });

    await prisma.user.update({
      where: { id: entry.userId },
      data: { walletBalance: { increment: entry.pool.reward } }
    });

    await prisma.transaction.create({
      data: {
        userId: entry.userId,
        amount: entry.pool.reward,
        type: "CREDIT",
        category: "POOL_INCOME",
        description: `Auto Pool ${entry.pool.name} completed! Reward: $${entry.pool.reward.toFixed(2)}`
      }
    });

    // Automatic re-entry as per requirements
    await enterAutoPool(entry.userId, entry.poolId);
  }
}
