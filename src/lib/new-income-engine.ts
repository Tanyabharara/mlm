import prisma from "@/lib/prisma";
import { convertToUSDT } from "@/lib/usdt";

/**
 * Distributes direct income up 10 levels based on the new logic:
 * L1: 10%, L2: 5%, L3: 1%, L4-10: 0.5%
 */
export async function distributeDirectIncome(userId: number, purchaseAmount: number) {
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

    const levelRewards: Record<number, number> = incomeConfig ? JSON.parse(incomeConfig.value) : defaultPercentages;

    let currentUplineId: number | null = user.referredById;
    let level = 1;

    while (currentUplineId && level <= 10) {
        const rewardPercentage = levelRewards[level] || 0;
        if (rewardPercentage > 0) {
            const commission = Number(purchaseAmount) * rewardPercentage;
            const upline: { referredById: number | null } = await prisma.user.update({
                where: { id: currentUplineId },
                data: {
                    walletBalance: { increment: commission }
                },
                select: { referredById: true }
            });

            await prisma.transaction.create({
                data: {
                    userId: currentUplineId,
                    amount: commission,
                    type: "CREDIT",
                    category: "DIRECT_INCOME",
                    description: `Level ${level} direct income from ${user.name || "user"} ($${commission.toFixed(2)})`,
                }
            });

            currentUplineId = upline.referredById;
        } else {
            break;
        }
        level++;
    }
}

/**
 * Handles entry into the global FIFO auto-pool.
 * Matrix logic: 3x3 (Width 3, Depth 3)
 */
export async function enterAutoPool(userId: number, poolId: number) {
    const pool = await prisma.autoPool.findUnique({ where: { id: poolId } });
    if (!pool) return;

    // 1. Check if user is already in this pool (active or completed)
    // Based on requirements, user does NOT re-enter Pool 1.
    const existingEntry = await prisma.autoPoolEntry.findFirst({
        where: { userId, poolId }
    });
    if (existingEntry) return existingEntry;

    // 2. Find the first available parent in the pool matrix (FIFO)
    const entries = await prisma.autoPoolEntry.findMany({
        where: { poolId: poolId },
        include: { _count: { select: { children: true } } },
        orderBy: { id: 'asc' }
    });

    const parentEntry = entries.find(e => e._count.children < pool.matrixWidth);

    const newEntry = await prisma.autoPoolEntry.create({
        data: {
            userId: userId,
            poolId: poolId,
            parentId: parentEntry?.id || null,
            level: parentEntry ? parentEntry.level + 1 : 1
        }
    });

    // 3. Immediately distribute income to uplines (3 levels up)
    await distributePoolIncome(newEntry.id);

    return newEntry;
}

/**
 * Distributes income level-wise to the parents in the matrix.
 * L1: 10%, L2: 20%, L3: 30%
 */
async function distributePoolIncome(entryId: number) {
    const freshEntry = await prisma.autoPoolEntry.findUnique({
        where: { id: entryId },
        include: { pool: true }
    });

    if (!freshEntry || !freshEntry.parentId) return;

    const entryFee = Number(freshEntry.pool.entryFee);
    const levelPercentages: Record<number, number> = {
        1: 0.10, // 10%
        2: 0.20, // 20%
        3: 0.30  // 30%
    };

    let currentParentId: number | null = freshEntry.parentId;
    let distLevel = 1;

    while (currentParentId && distLevel <= 3) {
        const parent: any = await prisma.autoPoolEntry.findUnique({
            where: { id: currentParentId },
            include: { pool: true }
        });

        if (!parent) break;

        const commission = entryFee * (levelPercentages[distLevel] || 0);

        if (commission > 0) {
            // Update parent wallet
            await prisma.user.update({
                where: { id: parent.userId },
                data: {
                    walletBalance: { increment: commission }
                }
            });

            // Log Transaction
            await prisma.transaction.create({
                data: {
                    userId: parent.userId,
                    amount: commission,
                    type: "CREDIT",
                    category: "POOL_INCOME",
                    description: `L${distLevel} pool income from ${freshEntry.id} in ${parent.pool.name} (₹${commission})`,
                }
            });

            // Check if this parent's pool is now completed (checking matrix fill)
            await checkPoolCompletion(parent.id);
        }

        currentParentId = parent.parentId;
        distLevel++;
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
                        include: {
                            children: true
                        }
                    }
                }
            }
        }
    });

    if (!entry || entry.isCompleted) return;

    // 3x3 Completion logic: L1: 3, L2: 9, L3: 27
    const countL1 = entry.children.length;
    let countL2 = 0;
    let countL3 = 0;

    entry.children.forEach(c1 => {
        countL2 += c1.children.length;
        c1.children.forEach(c2 => {
            countL3 += c2.children.length;
        });
    });

    // If L3 is filled, mark as completed
    if (countL1 >= 3 && countL2 >= 9 && countL3 >= 27) {
        await prisma.autoPoolEntry.update({
            where: { id: entryId },
            data: {
                isCompleted: true,
                completedAt: new Date()
            }
        });

        console.log(`Pool Entry ${entryId} completed. Upgrading...`);

        // Automatic Upgrade Logic: Pool 1 -> 2 -> 3
        if (entry.poolId === 1) {
            await enterAutoPool(entry.userId, 2);
        } else if (entry.poolId === 2) {
            await enterAutoPool(entry.userId, 3);
        }
    }
}
