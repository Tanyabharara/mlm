import { getPurchase, getPlan, getUserById, updateWalletBalance, createTransaction } from "@/lib/firebase-db";

export async function distributeIncome(purchaseId: string) {
  const purchase = await getPurchase(purchaseId);
  if (!purchase || !purchase.userId) return;

  const user = await getUserById(purchase.userId);
  if (!user || !(user as any).referredById) return;

  const plan = await getPlan(purchase.planId);
  if (!plan) return;

  let levelPercentages: Record<string, number>;
  try {
    levelPercentages = JSON.parse(plan.levelPercentages as any);
  } catch {
    console.error("Invalid levelPercentages JSON for plan", plan.id);
    return;
  }

  const purchaseAmount = Number((plan as any).price);
  if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
    console.error("Invalid plan price for income distribution", plan.id, plan.price);
    return;
  }

  let currentUserId: string | null = (user as any).referredById;
  let level = 1;

  while (currentUserId && level <= plan.levelCount) {
    const uplineUser = await getUserById(currentUserId);
    if (!uplineUser) break;

    if ((uplineUser as any).planId) {
      const percentage = levelPercentages[level.toString()] || 0;
      if (percentage > 0) {
        const commission = purchaseAmount * percentage;

        await updateWalletBalance(uplineUser.id, commission, "increment");
        await createTransaction({
          userId: uplineUser.id,
          amount: commission,
          type: "CREDIT",
          description: `Level ${level} commission from ${user.name || "user"}`,
        });
      }
    }

    currentUserId = (uplineUser as any).referredById || null;
    level++;
  }
}
