import { firestore } from "./src/lib/firebase-db";

async function listAdmins() {
    try {
        const snapshot = await firestore.collection("users").where("role", "==", "ADMIN").get();
        if (snapshot.empty) {
            console.log("No admins found in the database.");
            return;
        }

        console.log("Admin Users Found:");
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`- ${data.email} (Name: ${data.name || 'N/A'})`);
        });
    } catch (error) {
        console.error("Error fetching admins:", error);
    } finally {
        process.exit(0);
    }
}

listAdmins();
