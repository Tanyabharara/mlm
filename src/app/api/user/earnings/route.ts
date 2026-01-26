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
      where: { firebaseUid: verifiedUid }
    });

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

    const directIncome = transactions
      .filter((t) => t.category === "DIRECT_INCOME")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const poolIncome = transactions
      .filter((t) => t.category === "POOL_INCOME")
      .reduce((acc, t) => acc + Number(t.amount), 0);

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
      teamIncome: (totalEarnings - directIncome - poolIncome).toFixed(2),
      poolIncome: poolIncome.toFixed(2),
      autoPool: {
        name: poolEntry?.pool.name || "Pool 1",
        filled: filledCount,
        total: 27,
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
