import { getAllUsers, getPlans, updateUser } from "../lib/firebase-db";

async function main() {
    console.log("Analyzing users for plan activation...");
    const users = await getAllUsers();
    const plans = await getPlans();
    const targetPlan = plans[0];

    if (!targetPlan) {
        console.error("No plans found in database!");
        return;
    }

    let healedCount = 0;
    for (const user of users) {
        // If user has balance >= 6 but no planId, activate it
        if (!user.planId && (user.walletBalance >= 5 || user.email.includes("sandbox"))) {
            console.log(`Healing user: ${user.email} (Balance: ${user.walletBalance}). Setting Plan: ${targetPlan.id}`);
            await updateUser(user.id, { planId: targetPlan.id });
            healedCount++;
        }
    }

    console.log(`Successfully healed ${healedCount} users. They should now count as Verified.`);
}

main().catch(console.error).finally(() => process.exit(0));
