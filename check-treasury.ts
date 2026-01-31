import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const config = await prisma.appConfig.findUnique({
        where: { key: 'PLATFORM_CONFIG' }
    });
    console.log("Current Platform Config:", config ? config.value : "NOT SET");
}

main().catch(console.error).finally(() => prisma.$disconnect());
