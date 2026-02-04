import { getUserByEmail, getTransactions } from "./src/lib/firebase-db";

async function main() {
    console.log("Starting Transaction Investigation...");
    const user = await getUserByEmail("tanyabharara2003@gmail.com");
    if (!user) {
        console.log("User not found: tanyabharara2003@gmail.com");
        return;
    }

    console.log(`User: ${user.email} (ID: ${user.id})`);
    console.log(`Current Balance: $${user.walletBalance}`);

    const txs = await getTransactions(user.id, 50);
    console.log(`Found ${txs.length} recent transactions.`);

    txs.forEach((t: any) => {
        console.log(`- [${new Date(t.createdAt).toLocaleDateString()}] [${t.category}] ${t.type} $${t.amount}: ${t.description}`);
    });
}

main().catch(console.error).finally(() => process.exit(0));
