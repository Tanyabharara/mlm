import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required config values are present
const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (m) => "_" + m).toUpperCase()}`);

const isFirebaseConfigured = missingVars.length === 0;

if (!isFirebaseConfigured) {
  console.warn(`Firebase is missing configuration for: ${missingVars.join(", ")}. Authentication will not work correctly.`);
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
const googleProvider = new GoogleAuthProvider();

if (typeof window !== "undefined") {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
    } else {
        app = getApp();
        auth = getAuth(app);
    }
}

export { app, auth, googleProvider, isFirebaseConfigured };
