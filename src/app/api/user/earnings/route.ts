import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase-db";
import {
  getUserByFirebaseUid,
  getTransactions,
  getAutoPoolEntriesByUser,
  getAutoPoolEntryChildren,
  getMilestonesByUser,
  getDirectReferrals,
  getAutoPools,
} from "@/lib/firebase-db";

async function buildEntryTree(entry: any): Promise<any> {
  const children = await getAutoPoolEntryChildren(entry.id);
  const childrenWithNested = await Promise.all(children.map((c: any) => buildEntryTree(c)));
  return { ...entry, children: childrenWithNested };
}

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

    const dbUser: any = await getUserByFirebaseUid(verifiedUid);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [transactions, poolEntriesFlat, milestones, referrals, allPoolConfigs] = await Promise.all([
      getTransactions(dbUser.id, 20),
      getAutoPoolEntriesByUser(dbUser.id),
      getMilestonesByUser(dbUser.id),
      getDirectReferrals(dbUser.id, 500),
      getAutoPools(),
    ]);

    const poolEntries = await Promise.all(
      poolEntriesFlat.map((e: any) => buildEntryTree(e))
    );

    const totalEarnings = transactions
      .filter((t: any) => t.type === "CREDIT" && t.category !== "PLAN_ACTIVATION")
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0);

    const levelEarnings = new Array(10).fill(0);
    transactions.forEach((t: any) => {
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
      .filter((t: any) => t.category === "DIRECT_INCOME")
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0);

    const poolIncome = transactions
      .filter((t: any) => t.category === "POOL_INCOME")
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0);

    const milestoneIncome = transactions
      .filter((t: any) => t.category === "MILESTONE_INCOME")
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0);

    const MILESTONE_SLABS = [
      { target: 10, reward: 0.2 },
      { target: 20, reward: 0.3 },
      { target: 50, reward: 0.4 },
    ];

    const now = new Date();
    const totalActiveReferrals = referrals.length;
    const activeRetainedReferralsCount = referrals.filter((ref: any) => {
      // THE RULE: Referral is successful only after paying $6 activation amount (hasPlan)
      return ref.planId && ref.planId !== "";
    }).length;

    const milestoneProgress = MILESTONE_SLABS.map((slab) => ({
      slab: slab.target,
      reward: slab.reward,
      targetCount: slab.target,
      currentCount: activeRetainedReferralsCount,
      potentialCount: totalActiveReferrals,
      isClaimed: milestones.some((m: any) => Number(m.slab) === Number(slab.target)),
    }));

    const allPoolsData = allPoolConfigs.map((pool: any) => {
      const entry = poolEntries.find((e: any) => String(e.poolId) === String(pool.id));

      let l1 = 0, l2 = 0, l3 = 0;
      if (entry) {
        l1 = entry.children?.length ?? 0;
        (entry.children || []).forEach((c1: any) => {
          l2 += c1.children?.length ?? 0;
          (c1.children || []).forEach((c2: any) => {
            l3 += c2.children?.length ?? 0;
          });
        });
      }

      const poolEarned = transactions
        .filter((t: any) => t.category === "POOL_INCOME" && t.description?.includes(pool.name))
        .reduce((acc: number, t: any) => acc + Number(t.amount), 0);

      let status: "ACTIVE" | "COMPLETED" | "LOCKED" = "LOCKED";
      if (entry) {
        status = entry.isCompleted ? "COMPLETED" : "ACTIVE";
      } else {
        if (String(pool.id) === "1" && dbUser.planId) status = "ACTIVE";
        if (Number(pool.id) > 1) {
          const prevEntry = poolEntries.find((e: any) => String(e.poolId) === String(Number(pool.id) - 1));
          if (prevEntry?.isCompleted) status = "ACTIVE";
        }
      }

      return {
        poolId: pool.id,
        name: pool.name,
        entryFee: String(pool.entryFee ?? 0),
        status,
        level1Count: l1,
        level2Count: l2,
        level3Count: l3,
        totalEarned: poolEarned.toFixed(2),
        isCurrent: entry && !entry.isCompleted,
      };
    });

    const currentEntry = poolEntries.find((e: any) => !e.isCompleted) || poolEntries[poolEntries.length - 1];
    const poolEntry = currentEntry;

    let filledCount = 0;
    if (poolEntry) {
      filledCount += poolEntry.children?.length ?? 0;
      (poolEntry.children || []).forEach((c1: any) => {
        filledCount += c1.children?.length ?? 0;
        (c1.children || []).forEach((c2: any) => {
          filledCount += c2.children?.length ?? 0;
        });
      });
    }

    const { getWithdrawalRequestsByUser } = await import("@/lib/firebase-db");
    const withdrawalRequests = await getWithdrawalRequestsByUser(dbUser.id);

    const totalPayouts = withdrawalRequests
      .filter((w: any) => w.status === "APPROVED")
      .reduce((acc: number, w: any) => acc + Number(w.amount), 0);

    const pendingWithdrawals = withdrawalRequests
      .filter((w: any) => w.status === "PENDING")
      .reduce((acc: number, w: any) => acc + Number(w.amount), 0);

    return NextResponse.json({
      totalEarnings: totalEarnings.toFixed(2),
      directIncome: directIncome.toFixed(2),
      teamIncome: (totalEarnings - directIncome - poolIncome - milestoneIncome).toFixed(2),
      poolIncome: poolIncome.toFixed(2),
      milestoneIncome: milestoneIncome.toFixed(2),
      milestones: milestoneProgress,
      levelEarnings: levelEarnings.map((v) => v.toFixed(2)),
      allPools: allPoolsData,
      autoPool: {
        name: currentEntry?.poolId ? allPoolConfigs.find((p: any) => String(p.id) === String(currentEntry.poolId))?.name ?? "Pool 1" : "Pool 1",
        filled: allPoolsData.find((p: any) => String(p.poolId) === String(currentEntry?.poolId || 1))?.level1Count ?? 0,
        total: 3,
      },
      recentTransactions: transactions.map((t: any) => ({
        ...t,
        amount: Number(t.amount).toFixed(2),
      })),
      totalPayouts: totalPayouts.toFixed(2),
      pendingWithdrawals: pendingWithdrawals.toFixed(2),
    });
  } catch (error: any) {
    console.error("[API Earnings] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
