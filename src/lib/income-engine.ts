// @ts-nocheck
import { prisma } from "@/lib/db";

export async function distributeIncome(purchaseId: number) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: {
        include: {
          plan: true,
        },
      },
      plan: true,
    },
  });

  if (!purchase || !purchase.user.referredById) return;

  const plan = purchase.plan;
  const levelPercentages = JSON.parse(plan.levelPercentages); 
  const purchaseAmount = Number(plan.price);

  let currentUserId: number | null = purchase.user.referredById;
  let level = 1;

  while (currentUserId && level <= plan.levelCount) {
    const uplineUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { plan: true }, 
    });

    if (!uplineUser) break;

    if (uplineUser.planId) {
       const percentage = levelPercentages[level.toString()] || 0;
       if (percentage > 0) {
           const commission = purchaseAmount * percentage;
           
           await prisma.$transaction([
               prisma.user.update({
                   where: { id: uplineUser.id },
                   data: {
                       walletBalance: { increment: commission }
                   }
               }),
               prisma.transaction.create({
                   data: {
                       userId: uplineUser.id,
                       amount: commission,
                       type: "CREDIT",
                       description: `Level ${level} commission from ${purchase.user.name || 'user'}`
                   }
               })
           ]);
       }
    }

    currentUserId = uplineUser.referredById;
    level++;
  }
}
