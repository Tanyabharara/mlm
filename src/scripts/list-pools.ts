import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const pools = await prisma.autoPool.findMany();
    console.log(JSON.stringify(pools, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
