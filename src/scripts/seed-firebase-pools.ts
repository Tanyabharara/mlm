import { setAutoPool } from "../lib/firebase-db";

async function main() {
    console.log("Seeding Firebase AutoPools with $1, $10, $100 entry fees...");

    // Pool 1: $1 entry (from $6 plan)
    await setAutoPool("1", {
        name: "Auto Pool 1",
        entryFee: 1,
        matrixWidth: 3,
        matrixDepth: 3,
        reward: 10.2 // (3*0.1 + 9*0.2 + 27*0.3)
    });

    // Pool 2: $10 entry (from Pool 1 completion)
    await setAutoPool("2", {
        name: "Auto Pool 2",
        entryFee: 10,
        matrixWidth: 3,
        matrixDepth: 3,
        reward: 102
    });

    // Pool 3: $100 entry (from Pool 2 completion)
    await setAutoPool("3", {
        name: "Auto Pool 3",
        entryFee: 100,
        matrixWidth: 3,
        matrixDepth: 3,
        reward: 1020
    });

    console.log("Firebase AutoPools updated successfully.");
}

main().catch(console.error).finally(() => process.exit(0));
