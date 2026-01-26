import { getUserByFirebaseUid, getReferrals } from "@/lib/firebase-db";
import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";

function buildNetworkNodes(
  userId: string,
  userName: string,
  referrals: any[],
  depth: number = 0,
  xOffset: number = 0,
  parentId?: string
): { nodes: any[]; edges: any[]; nextX: number } {
  const nodes: any[] = [];
  const edges: any[] = [];
  let currentX = xOffset;

  if (depth === 0) {
    nodes.push({
      id: userId,
      data: { label: userName || "You" },
      position: { x: 250, y: 0 },
      type: "input",
    });
  } else {
    nodes.push({
      id: userId,
      data: { label: userName || "User" },
      position: { x: currentX, y: depth * 100 },
    });
    if (parentId) {
      edges.push({
        id: `e${parentId}-${userId}`,
        source: parentId,
        target: userId,
      });
    }
  }

  let nextX = currentX;
  for (let i = 0; i < referrals.length; i++) {
    const referral = referrals[i];
    const nested = buildNetworkNodes(
      referral.id,
      referral.name || "User",
      referral.referrals || [],
      depth + 1,
      nextX,
      userId
    );
    nodes.push(...nested.nodes);
    edges.push(...nested.edges);
    nextX = nested.nextX + 200;
  }

  return { nodes, edges, nextX: Math.max(nextX, currentX + 200) };
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    const verifiedUid = await verifyAuthToken(req);
    if (!verifiedUid || verifiedUid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByFirebaseUid(verifiedUid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = (user as any).id as string;
    const userName = (user as any).name || "You";

    const referrals = await getReferrals(userId, 3);
    const { nodes, edges } = buildNetworkNodes(
      userId,
      userName,
      referrals as any[]
    );

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
