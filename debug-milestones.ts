import * as db from "./src/lib/firebase-db";
import { processUserMilestones } from "./src/lib/milestone-engine";

async function debug() {
    console.log("--- START DEBUG ---");
    const users = await db.getAllUsers();
    console.log(`Checking ${users.length} users...`);

    for (const user of users) {
        const referrals = await db.getDirectReferrals(user.id, 500);
        // Important: Use the SAME logic as the engine
        const now = new Date();
        const activeRetainedReferrals = referrals.filter((ref: any) => {
            if (ref.isBlocked) return false;
            const createdAt = ref.createdAt?.toDate ? ref.createdAt.toDate() : new Date(ref.createdAt);
            const daysSinceJoined = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

            const hasPlan = ref.planId && ref.planId !== "";
            const hasPaid = Number(ref.walletBalance) >= 1;

            return daysSinceJoined >= 0 && (hasPlan || hasPaid);
        });

        const verifiedCount = activeRetainedReferrals.length;

        if (verifiedCount >= 5) { // Check even for smaller counts to see what's happening
            const milestones = await db.getMilestonesByUser(user.id);
            const achievedSlabs = milestones.map((m: any) => m.slab);
            console.log(`User: ${user.email} (${user.id}) | Verified: ${verifiedCount} | Milestones: ${JSON.stringify(achievedSlabs)}`);

            if (verifiedCount >= 10 && !achievedSlabs.includes(10)) {
                console.log(">> ELIGIBLE FOR 10 SLAB. RUNNING ENGINE...");
                await processUserMilestones(user.id);
                console.log(">> Done.");
            }
        }
    }
    console.log("--- END DEBUG ---");
}
debug().catch(console.error).finally(() => process.exit(0));
