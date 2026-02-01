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
  { target: 10, reward: 20 },
  { target: 20, reward: 30 },
  { target: 50, reward: 40 },
];

const RETENTION_DAYS = 60;

export async function processMilestones() {
  console.log("Starting Milestone Processing...");

  const users = await getAllUsers();

  for (const user of users) {
    const [referrals, milestones] = await Promise.all([
      getDirectReferrals(user.id, 500),
      getMilestonesByUser(user.id),
    ]);

    const refsWithPlan = referrals.filter((ref: any) => !ref.isBlocked && ref.planId != null);
    const now = new Date();
    const activeRetainedReferrals = refsWithPlan.filter((ref: any) => {
      const daysSinceJoined = (now.getTime() - new Date(ref.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoined >= RETENTION_DAYS;
    });
    const referralCount = activeRetainedReferrals.length;
    const achievedSlabs = milestones.map((m: any) => m.slab);

    for (const slab of MILESTONE_SLABS) {
      if (referralCount >= slab.target && !achievedSlabs.includes(slab.target)) {
        const exists = await milestoneExists(user.id, slab.target);
        if (exists) continue;

        console.log(`User ${user.id} (${user.email}) achieved slab ${slab.target} with ${referralCount} retained referrals.`);

        await createMilestone({ userId: user.id, slab: slab.target, amount: slab.reward });
        await updateWalletBalance(user.id, slab.reward, "increment");
        await createTransaction({
          userId: user.id,
          amount: slab.reward,
          type: "CREDIT",
          category: "MILESTONE_INCOME",
          description: `Target Incentive Reward for achieving ${slab.target} direct referrals (Retained for 2 months)`,
        });
      }
    }
  }

  console.log("Milestone Processing Completed.");
}
