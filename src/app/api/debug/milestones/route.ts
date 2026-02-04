import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, getDirectReferrals, getMilestonesByUser } from "@/lib/firebase-db";
import { processUserMilestones } from "@/lib/milestone-engine";
import * as admin from "firebase-admin";

export async function GET(req: NextRequest) {
    const users = await getAllUsers();
    const results = [];
    const db = admin.firestore();

    for (const user of users) {
        const referrals = await getDirectReferrals(user.id, 500);
        const now = new Date();
        const verified = referrals.filter((ref: any) => {
            const createdAt = ref.createdAt?.toDate ? ref.createdAt.toDate() : new Date(ref.createdAt);
            const daysSinceJoined = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            const hasPlan = ref.planId && ref.planId !== "";
            const hasPaid = Number(ref.walletBalance) >= 1;
            return daysSinceJoined >= 0 && (hasPlan || hasPaid);
        });

        if (verified.length >= 10) {
            const milestones = await getMilestonesByUser(user.id);
            const achieved = milestones.map((m: any) => m.slab);

            const transactionsSnapshot = await db.collection("transactions")
                .where("userId", "==", user.id)
                .where("category", "==", "MILESTONE_INCOME")
                .get();
            const txList = transactionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            results.push({
                email: user.email,
                id: user.id,
                verifiedCount: verified.length,
                milestones: achieved,
                milestoneTransactionsCount: txList.length,
                txs: txList
            });
        }
    }

    return NextResponse.json({ results });
}
