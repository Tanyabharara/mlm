import { getPurchase, getPlan, getUserById, updateWalletBalance, createTransaction } from "@/lib/firebase-db";

export async function distributeIncome(purchaseId: string) {
  const purchase = await getPurchase(purchaseId);
  if (!purchase || !purchase.userId) return;

  const user = await getUserById(purchase.userId);
  if (!user || !user.referredById) return;

  const plan = await getPlan(purchase.planId);
  if (!plan) return;

  const levelPercentages = JSON.parse(plan.levelPercentages);
  const purchaseAmount = Number(plan.price);

  let currentUserId: string | null = user.referredById;
  let level = 1;

  while (currentUserId && level <= plan.levelCount) {
    const uplineUser = await getUserById(currentUserId);
    if (!uplineUser) break;

    if (uplineUser.planId) {
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

    currentUserId = uplineUser.referredById || null;
    level++;
  }
}
