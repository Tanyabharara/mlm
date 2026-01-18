// @ts-nocheck
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    const user = await prisma.user.findUnique({
        where: { firebaseUid: uid },
        include: {
            referrals: {
                include: {
                    referrals: {
                        include: {
                            referrals: true
                        }
                    }
                }
            }
        }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const nodes = [];
    const edges = [];
    
    // Root Node
    nodes.push({ id: user.id.toString(), data: { label: user.name || "You" }, position: { x: 250, y: 0 }, type: 'input' });

    // Recursively add nodes (manually unrolled for now)
    user.referrals.forEach((r1, i) => {
        nodes.push({ id: r1.id.toString(), data: { label: r1.name || "User" }, position: { x: i * 200, y: 100 } });
        edges.push({ id: `e${user.id}-${r1.id}`, source: user.id.toString(), target: r1.id.toString() });
        
        if (r1.referrals) {
            r1.referrals.forEach((r2, j) => {
                nodes.push({ id: r2.id.toString(), data: { label: r2.name || "User" }, position: { x: i * 200 + j * 150, y: 200 } });
                edges.push({ id: `e${r1.id}-${r2.id}`, source: r1.id.toString(), target: r2.id.toString() });

                if (r2.referrals) {
                    r2.referrals.forEach((r3, k) => {
                        nodes.push({ id: r3.id.toString(), data: { label: r3.name || "User" }, position: { x: i * 200 + j * 150 + k * 100, y: 300 } });
                        edges.push({ id: `e${r2.id}-${r3.id}`, source: r2.id.toString(), target: r3.id.toString() });
                    });
                }
            });
        }
    });

    return NextResponse.json({ nodes, edges });
  } catch (error) {
     return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
