import { getUserByEmail, updateUser, setAppConfig } from "../lib/firebase-db";

async function setupAdmin() {
  const adminEmail = "your-admin-email@example.com";
  const treasuryWallet = "0xYourTreasuryWalletAddressHere";

  console.log("Starting Admin Setup...");

  try {
    const user: any = await getUserByEmail(adminEmail);
    if (user) {
      await updateUser(user.id, { role: "ADMIN" });
      console.log(`User ${adminEmail} promoted to ADMIN.`);
    } else {
      console.error(`Could not find user with email ${adminEmail}. Make sure they have logged in once.`);
    }
  } catch (e) {
    console.error("Error promoting user:", e);
  }

  await setAppConfig(
    "PLATFORM_CONFIG",
    JSON.stringify({
      treasuryAddress: treasuryWallet,
      planPrice: "600",
    })
  );

  console.log(`Platform Config updated with Treasury: ${treasuryWallet}`);
  console.log("Admin Setup Complete.");
}

setupAdmin().catch((e) => console.error(e));
