import {
  getAllUsers,
  getDirectReferrals,
  getMilestonesByUser,
  milestoneExists,
  createMilestone,
  updateWalletBalance,
  createTransaction,
} from "./firebase-db";

const MILESTONE_SLABS = [
  { target: 10, reward: 0.2 },
  { target: 20, reward: 0.3 },
  { target: 50, reward: 0.4 },
];

const RETENTION_DAYS = 0; // Reduced from 60 for testing/sandbox progression

export async function processMilestones() {
  console.log("Starting Milestone Processing...");
  const users = await getAllUsers();
  for (const user of users) {
    await processUserMilestones(user.id);
  }
  console.log("Milestone Processing Completed.");
}

export async function processUserMilestones(userId: string) {
  const [referrals, milestones] = await Promise.all([
    getDirectReferrals(userId, 500),
    getMilestonesByUser(userId),
  ]);

  const now = new Date();
  const activeRetainedReferrals = referrals.filter((ref: any) => {
    if (ref.isBlocked) return false;
    const createdAt = ref.createdAt?.toDate ? ref.createdAt.toDate() : new Date(ref.createdAt);
    const daysSinceJoined = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    const hasPlan = ref.planId && ref.planId !== "";
    const hasPaid = Number(ref.walletBalance) >= 1;

    return daysSinceJoined >= RETENTION_DAYS && (hasPlan || hasPaid);
  });

  const referralCount = activeRetainedReferrals.length;
  const achievedSlabs = milestones.map((m: any) => m.slab);

  for (const slab of MILESTONE_SLABS) {
    if (referralCount >= slab.target && !achievedSlabs.includes(slab.target)) {
      const exists = await milestoneExists(userId, slab.target);
      if (exists) continue;

      console.log(`[Milestone] User ${userId} achieved target ${slab.target} with ${referralCount} referrals.`);

      await createMilestone({ userId, slab: slab.target, amount: slab.reward });
      await updateWalletBalance(userId, slab.reward, "increment");
      await createTransaction({
        userId,
        amount: slab.reward,
        type: "CREDIT",
        category: "MILESTONE_INCOME",
        description: `Target Incentive Reward for achieving ${slab.target} direct referrals`,
      });
      console.log(`[Milestone] Reward credited for slab ${slab.target} to user ${userId}`);
    }
  }
}
