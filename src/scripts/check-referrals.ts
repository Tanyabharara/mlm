import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            referralCode: true,
            referredById: true,
            planId: true,
            referredBy: {
                select: {
                    email: true
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
