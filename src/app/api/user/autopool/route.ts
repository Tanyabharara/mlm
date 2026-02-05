import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import {
  getUserByFirebaseUid,
  getAutoPools,
  getAutoPoolEntriesByUser,
  getAutoPoolEntryChildren,
  countAutoPoolEntriesByPool,
  getAutoPoolEntry,
  updateAutoPoolEntry,
  updateWalletBalance,
  createTransaction,
  getAutoPool,
  getFirstAdminUser,
  updatePlatformPoolBalance,
} from "@/lib/firebase-db";
import { enterAutoPool } from "@/lib/new-income-engine";

async function buildEntryTree(entry: any): Promise<any> {
  const children = await getAutoPoolEntryChildren(entry.id);
  const childrenWithNested = await Promise.all(children.map((c: any) => buildEntryTree(c)));
  return { ...entry, children: childrenWithNested };
}

export async function GET(request: Request) {
  try {
    const verifiedUid = await verifyAuthToken(request);

    if (!verifiedUid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user: any = await getUserByFirebaseUid(verifiedUid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pools = await getAutoPools();
    const poolEntriesFlat = await getAutoPoolEntriesByUser(user.id);
    const poolEntries = await Promise.all(poolEntriesFlat.map((e: any) => buildEntryTree(e)));

    const poolStats = pools.map((pool: any) => {
      const entry = poolEntries.find((e: any) => String(e.poolId) === String(pool.id));

      let l1 = 0, l2 = 0, l3 = 0;
      let tree: any = null;

      if (entry) {
        l1 = entry.children?.length ?? 0;
        tree = {
          id: entry.id,
          level: 0,
          children: (entry.children || []).map((c1: any) => {
            l2 += c1.children?.length ?? 0;
            return {
              id: c1.id,
              level: 1,
              children: (c1.children || []).map((c2: any) => {
                l3 += c2.children?.length ?? 0;
                return {
                  id: c2.id,
                  level: 2,
                  children: (c2.children || []).map((c3: any) => ({
                    id: c3.id,
                    level: 3,
                  })),
                };
              }),
            };
          }),
        };
      }

      let status: "ACTIVE" | "COMPLETED" | "LOCKED" = "LOCKED";
      if (entry) {
        status = entry.isCompleted ? "COMPLETED" : "ACTIVE";
      } else {
        if (String(pool.id) === "1" && user.planId) status = "ACTIVE";
        const poolNum = Number(pool.id);
        if (!Number.isNaN(poolNum) && poolNum > 1) {
          const prevEntry = poolEntries.find((e: any) => String(e.poolId) === String(poolNum - 1));
          if (prevEntry?.isCompleted) status = "ACTIVE";
        }
      }

      const entryFee = Number(pool.entryFee || 0);
      const levelIncome = {
        l1: l1 * (entryFee * 0.1),
        l2: l2 * (entryFee * 0.2),
        l3: l3 * (entryFee * 0.3),
      };

      return {
        id: pool.id,
        name: pool.name,
        entryFee: String(entryFee),
        status,
        upgradeChoice: entry?.upgradeChoice || null,
        heldIncome: entry?.heldIncome || 0,
        stats: { l1, l2, l3 },
        levelIncome,
        tree,
      };
    });

    const totalUsersInSystem = await countAutoPoolEntriesByPool("1");
    const userEntry1 = poolEntries.find((e: any) => String(e.poolId) === "1");
    const userPosition = userEntry1?.id ?? 0;

    return NextResponse.json({
      pools: poolStats,
      globalStats: {
        totalUsers: totalUsersInSystem,
        userPosition,
      },
    });
  } catch (error: any) {
    console.error("[API AutoPool] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const verifiedUid = await verifyAuthToken(request);
    if (!verifiedUid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { entryId, action } = await request.json();
    if (!entryId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const entry = await getAutoPoolEntry(entryId);
    const user: any = await getUserByFirebaseUid(verifiedUid);

    if (!entry || !user || String(entry.userId) !== String(user.id)) {
      return NextResponse.json({ error: "Unauthorized or entry not found" }, { status: 403 });
    }

    if (!entry.isCompleted) {
      return NextResponse.json({ error: "Pool not completed yet" }, { status: 400 });
    }

    if (entry.upgradeChoice) {
      return NextResponse.json({ error: "Choice already made" }, { status: 400 });
    }

    const nextPoolId = String(Number(entry.poolId) + 1);
    const nextPool = await getAutoPool(nextPoolId);
    const currentPool = await getAutoPool(entry.poolId);

    if (action === "UPGRADE") {
      if (!nextPool) {
        return NextResponse.json({ error: "No more pools available" }, { status: 400 });
      }

      const entryFee = Number(nextPool.entryFee);
      const heldAmount = Number(entry.heldIncome || 0);

      if (heldAmount < entryFee) {
        // If held amount is not enough, check wallet as fallback? 
        // User said: "money collected from pool 1 will be used in pool 2 instantly"
        // This implies it SHOULD be enough. Pool 1 reward (₹1020) > Pool 2 fee (₹1000).
        return NextResponse.json({ error: "Insufficient pool earnings for upgrade" }, { status: 400 });
      }

      // 1. Calculate Surplus and Entry Fee
      const surplus = heldAmount - entryFee;

      // 2. Surplus goes to ADMIN wallet
      if (surplus > 0) {
        const adminUser = await getFirstAdminUser();
        if (adminUser) {
          await updateWalletBalance(adminUser.id, surplus, "increment");
          await createTransaction({
            userId: adminUser.id,
            amount: surplus,
            type: "CREDIT",
            category: "POOL_SURPLUS",
            description: `Surplus from ${user.name || user.id} completing ${currentPool?.name || "Pool"}`,
          });
        }
      }

      // 3. Entry fee ($10) is debited from Admin Pool and effectively paid for user
      await updatePlatformPoolBalance(entryFee, "decrement");

      // Log CREDIT for user (as their reward hitting the wallet)
      await updateWalletBalance(user.id, entryFee, "increment");
      await createTransaction({
        userId: user.id,
        amount: entryFee,
        type: "CREDIT",
        category: "POOL_INCOME",
        description: `Collected reward from ${currentPool?.name || "Pool"}`,
      });

      // Log DEBIT for user (paying for the next pool)
      await updateWalletBalance(user.id, -entryFee, "increment");
      await createTransaction({
        userId: user.id,
        amount: entryFee,
        type: "DEBIT",
        category: "POOL_UPGRADE",
        description: `Entry fee for ${nextPool.name}`,
      });

      await enterAutoPool(user.id, nextPoolId);
      await updateAutoPoolEntry(entryId, { upgradeChoice: "UPGRADED" } as any);

      return NextResponse.json({ success: true, message: `Successfully upgraded to ${nextPool.name}. Surplus of $${surplus.toFixed(2)} sent to Admin.` });
    } else if (action === "CLAIM") {
      const heldAmount = Number(entry.heldIncome || 0);
      if (heldAmount <= 0) {
        return NextResponse.json({ error: "No earnings to claim" }, { status: 400 });
      }

      // Calculate the "round" reward amount (10x the entry fee)
      // Pool 1 ($1 fee) -> $10 reward, $0.20 surplus
      // Pool 2 ($10 fee) -> $100 reward, $2 surplus
      const entryFee = Number(currentPool?.entryFee || 1);
      const roundReward = entryFee * 10;
      const surplus = heldAmount - roundReward;

      // 1. Surplus ($0.20) goes to ADMIN as company fee
      if (surplus > 0) {
        const adminUser = await getFirstAdminUser();
        if (adminUser) {
          await updateWalletBalance(adminUser.id, surplus, "increment");
          await createTransaction({
            userId: adminUser.id,
            amount: surplus,
            type: "CREDIT",
            category: "POOL_COMPANY_FEE",
            description: `Processing fee from ${user.name || user.id}'s ${currentPool?.name || "Pool"} claim`,
          });
        }
      }

      // 2. Debit Admin Platform Pool (for the user's $10 portion)
      await updatePlatformPoolBalance(roundReward, "decrement");

      // 3. Credit User Wallet (The rounded reward)
      await updateWalletBalance(user.id, roundReward, "increment");
      await createTransaction({
        userId: user.id,
        amount: roundReward,
        type: "CREDIT",
        category: "POOL_INCOME",
        description: `Final net reward from ${currentPool?.name || "Pool"} (after processing fee)`,
      });

      // 4. Create a withdrawal request for admin approval
      // Lock the $10 in a withdrawal request
      await updateWalletBalance(user.id, -roundReward, "increment");
      await createTransaction({
        userId: user.id,
        amount: roundReward,
        type: "DEBIT",
        category: "WITHDRAWAL_REQUEST",
        description: `Withdrawal request for ${currentPool?.name || "Pool"} settled reward`,
      });

      const { createWithdrawalRequest } = await import("@/lib/firebase-db");
      await createWithdrawalRequest({
        userId: user.id,
        amount: roundReward,
      });

      await updateAutoPoolEntry(entryId, { upgradeChoice: "CLAIMED" } as any);

      return NextResponse.json({
        success: true,
        message: `Processed $${roundReward.toFixed(2)} to your wallet and sent withdrawal request. Company fee of $${surplus.toFixed(2)} collected.`
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API AutoPool Action] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
