import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const targetAdmin = "tanyabharara333@gmail.com";

    console.log("Starting Admin Consolidation...");

    // 1. Demote everyone else
    const demoteRes = await prisma.user.updateMany({
        where: {
            email: { not: targetAdmin },
            role: "ADMIN"
        },
        data: { role: "USER" }
    });
    console.log(`✅ Demoted ${demoteRes.count} users to USER role.`);

    // 2. Ensure target is admin
    const promoteRes = await prisma.user.update({
        where: { email: targetAdmin },
        data: { role: "ADMIN" }
    });
    console.log(`✅ Confirmed ${targetAdmin} is the ONLY system ADMIN.`);

    const currentAdmins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true }
    });
    console.log("Final Admin List:", JSON.stringify(currentAdmins, null, 2));
}

main()
    .catch(e => {
        console.error("Error during cleanup:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
