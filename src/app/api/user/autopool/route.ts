import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-server";

export async function GET(request: Request) {
    try {
        const verifiedUid = await verifyAuthToken(request);

        if (!verifiedUid) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const user: any = await prisma.user.findUnique({
            where: { firebaseUid: verifiedUid },
            include: {
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
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const pools = await prisma.autoPool.findMany({ orderBy: { id: 'asc' } });

        const poolStats = pools.map((pool: any) => {
            const entry = user.poolEntries.find((e: any) => e.poolId === pool.id);

            let l1 = 0, l2 = 0, l3 = 0;
            let tree: any = null;

            if (entry) {
                l1 = entry.children.length;
                tree = {
                    id: entry.id,
                    level: 0,
                    children: entry.children.map((c1: any) => {
                        l2 += c1.children.length;
                        return {
                            id: c1.id,
                            level: 1,
                            children: c1.children.map((c2: any) => {
                                l3 += c2.children.length;
                                return {
                                    id: c2.id,
                                    level: 2,
                                    children: c2.children.map((c3: any) => ({
                                        id: c3.id,
                                        level: 3
                                    }))
                                };
                            })
                        };
                    })
                };
            }

            // Determine status
            let status: 'ACTIVE' | 'COMPLETED' | 'LOCKED' = 'LOCKED';
            if (entry) {
                status = entry.isCompleted ? 'COMPLETED' : 'ACTIVE';
            } else {
                if (pool.id === 1 && user.planId) status = 'ACTIVE';
                if (pool.id > 1) {
                    const prevEntry = user.poolEntries.find((e: any) => e.poolId === pool.id - 1);
                    if (prevEntry?.isCompleted) status = 'ACTIVE';
                }
            }

            return {
                id: pool.id,
                name: pool.name,
                entryFee: pool.entryFee.toString(),
                status,
                stats: { l1, l2, l3 },
                tree
            };
        });

        // Global queue stats (approximate based on creation order)
        const totalUsersInSystem = await prisma.autoPoolEntry.count({ where: { poolId: 1 } });
        const userPosition = user.poolEntries.find((e: any) => e.poolId === 1)?.id || 0;

        return NextResponse.json({
            pools: poolStats,
            globalStats: {
                totalUsers: totalUsersInSystem,
                userPosition: userPosition
            }
        });

    } catch (error: any) {
        console.error("[API AutoPool] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
