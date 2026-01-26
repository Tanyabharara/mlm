import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function promoteAdmin(email: string) {
    const user = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" }
    });
    console.log(`User ${email} is now an ADMIN. 👑`);
}

// Usage: npx ts-node src/scripts/promote-admin.ts user@example.com
const email = process.argv[2];
if (email) {
    promoteAdmin(email)
        .catch(e => console.error(e))
        .finally(() => prisma.$disconnect());
} else {
    console.log("Please provide an email address.");
}
