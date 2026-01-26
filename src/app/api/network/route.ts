import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getReferralsRecursive(userId: number, currentLevel: number, maxLevel: number): Promise<any[]> {
  if (currentLevel > maxLevel) return [];

  const referrals = await prisma.user.findMany({
    where: { referredById: userId }
  });

  const results = [];
  for (const ref of referrals) {
    const children = await getReferralsRecursive(ref.id, currentLevel + 1, maxLevel);
    results.push({
      id: ref.id.toString(),
      data: {
        label: ref.name || "User",
        level: currentLevel,
        isRoot: false
      },
      referrals: children
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

    const user = await prisma.user.findUnique({
      where: { firebaseUid: verifiedUid }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch 3 levels deep for the tree visualization
    const referrals = await getReferralsRecursive(user.id, 1, 3);

    const nodes: any[] = [{
      id: user.id.toString(),
      data: { label: user.name || "You", isRoot: true, level: 0 },
      type: "input"
    }];
    const edges: any[] = [];

    flattenNodes(referrals, nodes, edges, user.id.toString());

    return NextResponse.json({ nodes, edges });
  } catch (error: any) {
    console.error("[API Network] Error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
