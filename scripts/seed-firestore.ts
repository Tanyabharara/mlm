import {
  setAppConfig,
  setPlan,
  setAutoPool,
  getPlans,
  getAutoPool,
} from "../src/lib/firebase-db";

async function seed() {
  await setAppConfig(
    "PLATFORM_CONFIG",
    JSON.stringify({
      treasuryAddress: process.env.TREASURY_WALLET_ADDRESS || "0xYourTreasuryWalletAddressHere",
      planPrice: "600",
    })
  );
  console.log("AppConfig PLATFORM_CONFIG set.");

  await setAppConfig(
    "LEVEL_INCOME_CONFIG",
    JSON.stringify({
      1: 0.1,
      2: 0.05,
      3: 0.01,
      4: 0.005,
      5: 0.005,
      6: 0.005,
      7: 0.005,
      8: 0.005,
      9: 0.005,
      10: 0.005,
    })
  );
  console.log("AppConfig LEVEL_INCOME_CONFIG set.");

  const plans = await getPlans();
  if (plans.length === 0) {
    await setPlan("1", {
      name: "Starter",
      price: 500,
      levelCount: 3,
      levelPercentages: JSON.stringify({ "1": 0.1, "2": 0.05, "3": 0.02 }),
    });
    await setPlan("2", {
      name: "Pro",
      price: 1000,
      levelCount: 5,
      levelPercentages: JSON.stringify({ "1": 0.15, "2": 0.1, "3": 0.05, "4": 0.02, "5": 0.01 }),
    });
    console.log("Plans 1 and 2 created.");
  } else {
    console.log("Plans already exist, skipping.");
  }

  const pool1 = await getAutoPool("1");
  if (!pool1) {
    await setAutoPool("1", {
      name: "Pool 1",
      entryFee: 100,
      matrixWidth: 3,
      matrixDepth: 3,
      reward: 500,
    });
    await setAutoPool("2", {
      name: "Pool 2",
      entryFee: 200,
      matrixWidth: 3,
      matrixDepth: 3,
      reward: 1000,
    });
    await setAutoPool("3", {
      name: "Pool 3",
      entryFee: 300,
      matrixWidth: 3,
      matrixDepth: 3,
      reward: 1500,
    });
    console.log("AutoPools 1, 2, 3 created.");
  } else {
    console.log("AutoPools already exist, skipping.");
  }

  console.log("Firestore seed done.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
