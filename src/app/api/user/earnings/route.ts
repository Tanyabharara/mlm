import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-db";

export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization") || "";

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.substring("Bearer ".length).trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let verifiedUid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      verifiedUid = decoded.uid;
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get user from Prisma
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: verifiedUid },
      include: {
        milestones: true,
        poolEntries: {
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
        },
        referrals: {
          where: {
            planId: { not: null },
            isBlocked: false
          } as any
        }
      } as any
    }) as any;

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch data from Prisma
    const transactions = await prisma.transaction.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const poolEntry = await prisma.autoPoolEntry.findFirst({
      where: { userId: dbUser.id, isCompleted: false },
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

    const totalEarnings = transactions
      .filter((t) => t.type === "CREDIT")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const levelEarnings = new Array(10).fill(0);
    transactions.forEach(t => {
      if (t.type === "CREDIT" && t.category === "DIRECT_INCOME") {
        const match = t.description?.match(/Level (\d+)/);
        if (match) {
          const level = parseInt(match[1]);
          if (level >= 1 && level <= 10) {
            levelEarnings[level - 1] += Number(t.amount);
          }
        }
      }
    });

    const directIncome = transactions
      .filter((t) => t.category === "DIRECT_INCOME")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const poolIncome = transactions
      .filter((t) => t.category === "POOL_INCOME")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const milestoneIncome = transactions
      .filter((t) => t.category === "MILESTONE_INCOME")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    // Calculate milestone progress
    const MILESTONE_SLABS = [
      { target: 10, reward: 20 },
      { target: 20, reward: 30 },
      { target: 50, reward: 40 },
    ];

    const now = new Date();
    const activeRetainedReferralsCount = dbUser.referrals.filter((ref: any) => {
      const daysSinceJoined = (now.getTime() - new Date(ref.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoined >= 60; // 2 months
    }).length;

    const milestoneProgress = MILESTONE_SLABS.map(slab => ({
      slab: slab.target,
      reward: slab.reward,
      targetCount: slab.target,
      currentCount: activeRetainedReferralsCount,
      isClaimed: dbUser.milestones.some((m: any) => m.slab === slab.target)
    }));

    // Calculate detailed pool stats for all 3 pools
    const allPoolConfigs = await prisma.autoPool.findMany({ orderBy: { id: 'asc' } });
    const allPoolsData = allPoolConfigs.map((pool: any) => {
      const entry = dbUser.poolEntries.find((e: any) => e.poolId === pool.id);

      let l1 = 0, l2 = 0, l3 = 0;
      if (entry) {
        l1 = entry.children.length;
        entry.children.forEach((c1: any) => {
          l2 += c1.children.length;
          c1.children.forEach((c2: any) => {
            l3 += c2.children.length;
          });
        });
      }

      const poolEarned = transactions
        .filter(t => t.category === "POOL_INCOME" && t.description?.includes(pool.name))
        .reduce((acc, t) => acc + Number(t.amount), 0);

      // Status logic
      let status: 'ACTIVE' | 'COMPLETED' | 'LOCKED' = 'LOCKED';
      if (entry) {
        status = entry.isCompleted ? 'COMPLETED' : 'ACTIVE';
      } else {
        // Pool 1 is active if user has a plan. Pool 2/3 active if previous is completed.
        if (pool.id === 1 && dbUser.planId) status = 'ACTIVE';
        if (pool.id > 1) {
          const prevEntry = dbUser.poolEntries.find((e: any) => e.poolId === pool.id - 1);
          if (prevEntry?.isCompleted) status = 'ACTIVE';
        }
      }

      return {
        poolId: pool.id,
        name: pool.name,
        entryFee: pool.entryFee.toString(),
        status,
        level1Count: l1,
        level2Count: l2,
        level3Count: l3,
        totalEarned: poolEarned.toFixed(2),
        isCurrent: entry && !entry.isCompleted
      };
    });

    const currentEntry = dbUser.poolEntries.find((e: any) => !e.isCompleted) || dbUser.poolEntries[dbUser.poolEntries.length - 1];

    // Calculate filled members (3x3 logic)
    let filledCount = 0;
    if (poolEntry) {
      filledCount += poolEntry.children.length;
      poolEntry.children.forEach((c1: any) => {
        filledCount += c1.children.length;
        c1.children.forEach((c2: any) => {
          filledCount += c2.children.length;
        });
      });
    }

    return NextResponse.json({
      totalEarnings: totalEarnings.toFixed(2),
      directIncome: directIncome.toFixed(2),
      teamIncome: (totalEarnings - directIncome - poolIncome - milestoneIncome).toFixed(2),
      poolIncome: poolIncome.toFixed(2),
      milestoneIncome: milestoneIncome.toFixed(2),
      milestones: milestoneProgress,
      levelEarnings: levelEarnings.map(v => v.toFixed(2)),
      allPools: allPoolsData,
      autoPool: {
        name: currentEntry?.pool.name || "Pool 1",
        filled: allPoolsData.find(p => p.poolId === (currentEntry?.poolId || 1))?.level1Count || 0,
        total: 3,
      },
      recentTransactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount).toFixed(2),
      })),
    });
  } catch (error: any) {
    console.error("[API Earnings] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
