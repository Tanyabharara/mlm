import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import {
  getUserByFirebaseUid,
  countUsersByReferredById,
  getUserById,
  getPlan,
} from "@/lib/firebase-db";

async function getUserStats(userId: string) {
  const [referralCount, info] = await Promise.all([
    countUsersByReferredById(userId),
    getUserById(userId),
  ]);
  const plan = info?.planId ? await getPlan(info.planId) : null;
  return {
    referralCount,
    planName: plan?.name || "No Plan",
    balance: String(info?.walletBalance ?? 0),
    joinedAt: info?.createdAt,
  };
}

async function getReferralsRecursive(userId: string, currentLevel: number, maxLevel: number): Promise<any[]> {
  if (currentLevel > maxLevel) return [];

  const { getUsersByReferredById } = await import("@/lib/firebase-db");
  const referrals = await getUsersByReferredById(userId);
  const results = [];

  for (const ref of referrals) {
    const [children, stats] = await Promise.all([
      getReferralsRecursive(ref.id, currentLevel + 1, maxLevel),
      getUserStats(ref.id),
    ]);

    results.push({
      id: ref.id,
      data: {
        label: ref.name || "User",
        level: currentLevel,
        isRoot: false,
        referralCode: ref.referralCode,
        ...stats,
      },
      referrals: children,
    });
  }
  return results;
}

function flattenNodes(referrals: any[], nodes: any[] = [], edges: any[] = [], parentId?: string) {
  for (const ref of referrals) {
    nodes.push({ id: ref.id, data: ref.data });
    if (parentId) {
      edges.push({ id: `e${parentId}-${ref.id}`, source: parentId, target: ref.id });
    }
    flattenNodes(ref.referrals, nodes, edges, ref.id);
  }
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    const verifiedUid = await verifyAuthToken(req);

    if (!verifiedUid || verifiedUid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user: any = await getUserByFirebaseUid(verifiedUid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [referrals, rootStats] = await Promise.all([
      getReferralsRecursive(user.id, 1, 3),
      getUserStats(user.id),
    ]);

    const nodes: any[] = [
      {
        id: user.id,
        data: {
          label: user.name || "You",
          isRoot: true,
          level: 0,
          referralCode: user.referralCode,
          ...rootStats,
        },
        type: "input",
      },
    ];
    const edges: any[] = [];

    flattenNodes(referrals, nodes, edges, user.id);

    return NextResponse.json({ nodes, edges });
  } catch (error: any) {
    console.error("[API Network] Error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
