import {
  getAllUsers,
  getUserById,
  getDirectReferrals,
  getMilestonesByUser,
  milestoneExists,
  createMilestone,
  updateWalletBalance,
  createTransaction,
  logSystemPayout,
} from "./firebase-db";

const MILESTONE_SLABS = [
  { target: 10, reward: 20 },
];

export async function processUserMilestones(userId: string) {
  const user: any = await getUserById(userId);
  if (!user || !user.createdAt) return;

  const [referrals, milestones] = await Promise.all([
    getDirectReferrals(userId, 500),
    getMilestonesByUser(userId),
  ]);

  // If user already has ANY milestone, they "won't go to milestone 2" (exclusive)
  if (milestones.length > 0) return;

  const now = new Date();
  const joinDate = new Date(user.createdAt);
  const oneMonthAfterJoin = new Date(joinDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Time Limit Rule: Must complete within 1 month (30 days)
  if (now > oneMonthAfterJoin) {
    // Logic: If they didn't hit it in 30 days, they never will.
    // However, we still check the referrals they got WITHIN that month?
    // Usually, it means "If you haven't hit 10 by day 30, you're ineligible".
    return;
  }

  const activeRetainedReferrals = referrals.filter((ref: any) => {
    if (ref.isBlocked) return false;
    const hasPlan = ref.planId && ref.planId !== "";
    return hasPlan;
  });

  const referralCount = activeRetainedReferrals.length;

  for (const slab of MILESTONE_SLABS) {
    if (referralCount >= slab.target) {
      const exists = await milestoneExists(userId, slab.target);
      if (exists) continue;

      console.log(`[Milestone] User ${userId} achieved target ${slab.target} with ${referralCount} referrals in under 30 days.`);

      // Store the milestone with a payout date 60 days in the future
      const payoutAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      await createMilestone({
        userId,
        slab: slab.target,
        amount: slab.reward,
        payoutAt: payoutAt.toISOString(),
        status: "PENDING_RETENTION" // Money is not credited yet
      });

      // We do NOT credit the wallet balance immediately here because of the "after 60 days" rule.
      // A separate job or admin approval will handle "PENDING_RETENTION" milestones.

      console.log(`[Milestone] Milestone ${slab.target} recorded for user ${userId}. Payout scheduled for ${payoutAt.toDateString()}`);
    }
  }
}
