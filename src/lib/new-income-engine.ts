
import {
  getUserById,
  getAppConfig,
  updateWalletBalance,
  createTransaction,
  getAutoPool,
  getAutoPoolEntryByUserAndPool,
  getAutoPoolEntriesByPool,
  countAutoPoolEntryChildren,
  createAutoPoolEntry,
  getAutoPoolEntry,
  updateAutoPoolEntry,
  getAutoPoolEntryChildren,
  logSystemPayout,
  getFirstAdminUser,
  updatePlatformPoolBalance,
} from "./firebase-db";

export async function distributeDirectIncome(userId: string, purchaseAmount: number) {
  const user: any = await getUserById(userId);
  if (!user || !user.referredById) return;

  const incomeConfig = await getAppConfig("LEVEL_INCOME_CONFIG");
  const defaultPercentages: Record<number, number> = {
    1: 0.1, 2: 0.05, 3: 0.01,
    4: 0.005, 5: 0.005, 6: 0.005, 7: 0.005, 8: 0.005, 9: 0.005, 10: 0.005,
  };
  const levelRewards: Record<number, number> = incomeConfig ? JSON.parse(incomeConfig.value) : defaultPercentages;

  let currentUplineId: string | null = user.referredById;
  let level = 1;

  while (currentUplineId && level <= 10) {
    const rewardPercentage = levelRewards[level] || 0;
    if (rewardPercentage > 0) {
      const commission = Number(purchaseAmount) * rewardPercentage;

      await logSystemPayout(
        currentUplineId,
        commission,
        "DIRECT_INCOME",
        `Level ${level} direct income from ${user.name || "user"} ($${commission.toFixed(2)})`
      );

      const upline: any = await getUserById(currentUplineId);
      currentUplineId = upline?.referredById || null;
    } else {
      break;
    }
    level++;
  }
}

export async function enterAutoPool(userId: string, poolId: number | string) {
  const poolIdStr = String(poolId);
  const pool: any = await getAutoPool(poolIdStr);
  if (!pool) return null;

  const existingEntry = await getAutoPoolEntryByUserAndPool(userId, poolIdStr);
  if (existingEntry) return existingEntry;

  const entries = await getAutoPoolEntriesByPool(poolIdStr);
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
    poolId: poolIdStr,
    parentId: parentEntry?.id || null,
    level: parentEntry ? (Number(parentEntry.level) || 0) + 1 : 1,
  });

  await distributePoolIncome(newEntry.id);
  return newEntry;
}

async function distributePoolIncome(entryId: string) {
  const freshEntry: any = await getAutoPoolEntry(entryId);
  if (!freshEntry || !freshEntry.parentId) return;

  const pool: any = await getAutoPool(freshEntry.poolId);
  const entryFee = Number(pool?.entryFee) || 0;
  const levelPercentages: Record<number, number> = {
    1: 0.1,
    2: 0.2,
    3: 0.3,
  };

  let currentParentId: string | null = freshEntry.parentId;
  let distLevel = 1;

  while (currentParentId && distLevel <= 3) {
    const parent: any = await getAutoPoolEntry(currentParentId);
    if (!parent) break;

    const commission = entryFee * (levelPercentages[distLevel] || 0);

    if (commission > 0) {
      const percentage = (levelPercentages[distLevel] || 0) * 100;
      await logSystemPayout(
        parent.userId,
        commission,
        "POOL_INCOME",
        `Auto Pool ${pool?.id || "?"} L${distLevel} income (${percentage}%) from entry ${freshEntry.id}`
      );
      await checkPoolCompletion(parent.id);
    }

    currentParentId = parent.parentId;
    distLevel++;
  }
}

async function checkPoolCompletion(entryId: string) {
  const entry: any = await getAutoPoolEntry(entryId);
  if (!entry || entry.isCompleted) return;

  const children = await getAutoPoolEntryChildren(entry.id);
  let countL2 = 0;
  let countL3 = 0;
  for (const c1 of children) {
    const c1Children = await getAutoPoolEntryChildren(c1.id);
    countL2 += c1Children.length;
    for (const c2 of c1Children) {
      const c2Children = await getAutoPoolEntryChildren(c2.id);
      countL3 += c2Children.length;
    }
  }
  const countL1 = children.length;

  if (countL1 >= 3 && countL2 >= 9 && countL3 >= 27) {
    await updateAutoPoolEntry(entryId, {
      isCompleted: true,
      completedAt: new Date(),
    } as any);

    const pool: any = await getAutoPool(entry.poolId);
    console.log(`[Pool] User ${entry.userId} completed ${pool?.name || entry.poolId}. Awaiting upgrade choice.`);
  }
}
