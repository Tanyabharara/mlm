const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function getEnv() {
    const envPath = path.join(__dirname, ".env");
    const content = fs.readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    const env = {};

    let currentKey = null;
    let currentValue = "";
    let inQuotes = false;

    lines.forEach(line => {
        if (!inQuotes) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();
                if (value.startsWith("'")) {
                    inQuotes = true;
                    currentKey = key;
                    currentValue = value.substring(1);
                    if (value.endsWith("'") && value.length > 1) {
                        inQuotes = false;
                        env[key] = value.substring(1, value.length - 1);
                    }
                } else {
                    env[key] = value;
                }
            }
        } else {
            if (line.endsWith("'")) {
                inQuotes = false;
                currentValue += "\n" + line.substring(0, line.length - 1);
                env[currentKey] = currentValue;
            } else {
                currentValue += "\n" + line;
            }
        }
    });
    return env;
}

const env = getEnv();
const serviceAccountKey = env.FIREBASE_SERVICE_ACCOUNT_KEY;

let serviceAccount;
try {
    serviceAccount = JSON.parse(serviceAccountKey);
} catch (e) {
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function promoteAdmin(email) {
    try {
        const snapshot = await db.collection("users").where("email", "==", email).get();
        if (snapshot.empty) {
            console.log(`User ${email} not found.`);
            return;
        }

        const doc = snapshot.docs[0];
        await doc.ref.update({ role: "ADMIN" });
        console.log(`Successfully promoted ${email} to ADMIN.`);
    } catch (error) {
        console.error("Error promoting user:", error);
    } finally {
        process.exit(0);
    }
}

const emailToPromote = "tanyabharara333@gmail.com";
promoteAdmin(emailToPromote);
