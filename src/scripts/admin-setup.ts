import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupAdmin() {
    const adminEmail = "your-admin-email@example.com"; // User should replace this
    const treasuryWallet = "0xYourTreasuryWalletAddressHere"; // User should replace this

    console.log("Starting Admin Setup...");

    // 1. Promote User to Admin
    try {
        const user = await prisma.user.update({
            where: { email: adminEmail },
            data: { role: "ADMIN" }
        });
        console.log(`✅ User ${adminEmail} promoted to ADMIN.`);
    } catch (e) {
        console.error(`❌ Could not find user with email ${adminEmail}. Make sure they have logged in once.`);
    }

    // 2. Setup Platform Config (Treasury & Price)
    const configValue = JSON.stringify({
        treasuryAddress: treasuryWallet,
        planPrice: "600"
    });

    await prisma.appConfig.upsert({
        where: { key: 'PLATFORM_CONFIG' },
        update: { value: configValue },
        create: { key: 'PLATFORM_CONFIG', value: configValue }
    });

    console.log(`✅ Platform Config updated with Treasury: ${treasuryWallet}`);
    console.log("Admin Setup Complete. 👑");
}

setupAdmin()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
