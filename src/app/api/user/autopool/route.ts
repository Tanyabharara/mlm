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

      return {
        id: pool.id,
        name: pool.name,
        entryFee: String(pool.entryFee ?? 0),
        status,
        upgradeChoice: entry?.upgradeChoice || null,
        stats: { l1, l2, l3 },
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

    if (action === "UPGRADE") {
      if (!nextPool) {
        return NextResponse.json({ error: "No more pools available" }, { status: 400 });
      }

      // IMPORTANT: No wallet deduction!
      // The completion reward ($10/$100/$1000) is already in wallet
      // This acts as automatic funding for next pool entry
      // User is reinvesting their earnings into the next pool

      // Enter next pool (no fee charged - earnings cover it)
      await enterAutoPool(user.id, nextPoolId);

      // Mark upgrade choice
      await updateAutoPoolEntry(entryId, { upgradeChoice: "UPGRADED" } as any);

      return NextResponse.json({ success: true, message: `Successfully upgraded to ${nextPool.name}` });
    } else if (action === "CLAIM") {
      // User chooses to withdraw earnings and exit pool system
      // Earnings already in wallet from completion reward
      // No further pool entry allowed - this is a final decision
      await updateAutoPoolEntry(entryId, { upgradeChoice: "CLAIMED" } as any);
      return NextResponse.json({ success: true, message: "Earnings claimed. Pool journey ended. You can now withdraw your funds." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API AutoPool Action] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
