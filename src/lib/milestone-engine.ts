import prisma from "@/lib/prisma";

const MILESTONE_SLABS = [
    { target: 10, reward: 20 },
    { target: 20, reward: 30 },
    { target: 50, reward: 40 },
];

const RETENTION_DAYS = 60; // 2 months

export async function processMilestones() {
    console.log("Starting Milestone Processing...");

    // 1. Get all users who might be eligible (at least 10 referrals)
    // We filter users who have at least 10 referrals to optimize
    const users = await prisma.user.findMany({
        where: {
            referrals: {
                some: {}
            }
        },
        include: {
            referrals: {
                where: {
                    isBlocked: false,
                    planId: { not: null }, // Must have an active plan
                } as any
            },
            milestones: true
        } as any
    }) as any[];

    for (const user of users) {
        const achievedSlabs = user.milestones.map((m: any) => m.slab);

        // Calculate how many referrals have completed the 60-day period
        const now = new Date();
        const activeRetainedReferrals = user.referrals.filter((ref: any) => {
            const daysSinceJoined = (now.getTime() - ref.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceJoined >= RETENTION_DAYS;
        });

        const referralCount = activeRetainedReferrals.length;

        for (const slab of MILESTONE_SLABS) {
            // Check if user reached the target and hasn't been rewarded for this slab yet
            if (referralCount >= slab.target && !achievedSlabs.includes(slab.target)) {
                console.log(`User ${user.id} (${user.email}) achieved slab ${slab.target} with ${referralCount} retained referrals.`);

                await prisma.$transaction(async (tx: any) => {
                    // 1. Create Milestone record (prevents double credit due to @@unique)
                    await tx.milestone.create({
                        data: {
                            userId: user.id,
                            slab: slab.target,
                            amount: slab.reward
                        }
                    });

                    // 2. Increment Wallet Balance
                    await tx.user.update({
                        where: { id: user.id },
                        data: {
                            walletBalance: { increment: slab.reward }
                        }
                    });

                    // 3. Create Transaction record
                    await tx.transaction.create({
                        data: {
                            userId: user.id,
                            amount: slab.reward,
                            type: "CREDIT",
                            category: "MILESTONE_INCOME",
                            description: `Target Incentive Reward for achieving ${slab.target} direct referrals (Retained for 2 months)`,
                        }
                    });
                });
            }
        }
    }

    console.log("Milestone Processing Completed.");
}
