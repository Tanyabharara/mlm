import prisma from "./src/lib/prisma";
async function main() {
    try {
        const count = await prisma.ottSubscription.count();
        console.log("OttSubscription count:", count);
        const users = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { email: true, role: true }
        });
        console.log("Admins:", users);
    } catch (e: any) {
        console.error("DB Error:", e.message);
    }
}
main().catch(console.error);
