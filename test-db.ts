import { firestore, getRecentPaymentIntents } from "./src/lib/firebase-db";

async function main() {
  try {
    const ottSnap = await firestore.collection("ottSubscriptions").get();
    console.log("OttSubscription count:", ottSnap.size);

    const adminSnap = await firestore.collection("users").where("role", "==", "ADMIN").get();
    const admins = adminSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log("Admins:", admins.map((a: any) => ({ email: a.email, role: a.role })));
  } catch (e: any) {
    console.error("DB Error:", e.message);
  }
}
main().catch(console.error);
