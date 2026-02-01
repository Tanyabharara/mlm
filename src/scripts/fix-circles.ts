import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    // Fix circular reference for admin
    await prisma.user.update({
        where: { id: 2 },
        data: { referredById: null }
    });
    console.log("Fixed circular reference for user id 2");
}
main().catch(console.error).finally(() => prisma.$disconnect());
