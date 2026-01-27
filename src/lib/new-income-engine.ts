import { PrismaClient } from "@prisma/client";
import { convertToUSDT } from "@/lib/usdt";

const prisma = new PrismaClient();

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

    const levelRewards: Record<number, number> = {
        1: 0.10, // 10%
        2: 0.05, // 5%
        3: 0.01, // 1%
    };
    // Levels 4-10: 0.5%
    for (let i = 4; i <= 10; i++) {
        levelRewards[i] = 0.005;
    }

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

    // Find the first available parent in the pool matrix (FIFO)
    // We look for an entry that has fewer than 'matrixWidth' children
    const potentialParent = await prisma.autoPoolEntry.findFirst({
        where: {
            poolId: poolId,
            children: {
                none: {
                    // This ensures we find entries with space
                }
            }
        },
        orderBy: { id: 'asc' }
    });

    // Wait, the 'none' filter above might not be what we want if we want to fill 'width' children.
    // Actually, we can find the oldest entry that hasn't reached its child limit.
    // Since Prisma 6 doesn't have an easy "has fewer than N children" in a single query without a count,
    // we'll do something a bit more robust.

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

    // After adding a child, check if the parent's level/matrix is completed
    if (parentEntry) {
        await checkPoolCompletion(parentEntry.id);
    }

    return newEntry;
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

    // 3x3 Completion logic:
    // L1: 3, L2: 9, L3: 27
    // Total children needed: 3 + 9 + 27 = 39
    // Alternatively, "3x3 (27 users)" might mean the 3rd level has 27.

    const countL1 = entry.children.length;
    let countL2 = 0;
    let countL3 = 0;

    entry.children.forEach(c1 => {
        countL2 += c1.children.length;
        c1.children.forEach(c2 => {
            countL3 += c2.children.length;
        });
    });

    if (countL1 >= 3 && countL2 >= 9 && countL3 >= 27) {
        await prisma.autoPoolEntry.update({
            where: { id: entryId },
            data: {
                isCompleted: true,
                completedAt: new Date()
            }
        });

        // Credit reward
        await prisma.user.update({
            where: { id: entry.userId },
            data: {
                walletBalance: { increment: entry.pool.reward }
            }
        });

        await prisma.transaction.create({
            data: {
                userId: entry.userId,
                amount: entry.pool.reward,
                type: "CREDIT",
                category: "POOL_INCOME",
                description: `Auto Pool ${entry.pool.name} completion reward ($${entry.pool.reward.toFixed(2)})`,
            }
        });

        // Optional: Auto re-entry
        await enterAutoPool(entry.userId, entry.poolId);
    }
}
