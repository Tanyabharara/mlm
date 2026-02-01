import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        select: { referralCode: true, name: true }
    });
    if (user) {
        console.log(`Referral Code: ${user.referralCode} (${user.name})`);
    } else {
        console.log('No users found in database.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
