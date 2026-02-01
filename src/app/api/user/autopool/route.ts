import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import {
  getUserByFirebaseUid,
  getAutoPools,
  getAutoPoolEntriesByUser,
  getAutoPoolEntryChildren,
  countAutoPoolEntriesByPool,
} from "@/lib/firebase-db";

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
