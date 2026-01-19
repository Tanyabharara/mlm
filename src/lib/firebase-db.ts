import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app: App;
let db: Firestore;

if (!getApps().length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const databaseId = process.env.FIREBASE_DATABASE_ID || "(default)";
  
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  let serviceAccount;
  if (serviceAccountKey) {
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY");
    }
  }

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
    });
  } else if (projectId) {
    app = initializeApp({
      projectId: projectId,
    });
  } else {
    app = initializeApp();
  }
  
  const useEmulator = process.env.FIREBASE_EMULATOR_HOST;
  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST = useEmulator;
  }
  
  db = databaseId !== "(default)" ? getFirestore(app, databaseId) : getFirestore(app);
  
  if (useEmulator) {
    db.settings({
      host: useEmulator,
      ssl: false,
    });
  }
} else {
  app = getApps()[0];
  const databaseId = process.env.FIREBASE_DATABASE_ID || "(default)";
  const useEmulator = process.env.FIREBASE_EMULATOR_HOST;
  
  db = databaseId !== "(default)" ? getFirestore(app, databaseId) : getFirestore(app);
  
  if (useEmulator) {
    db.settings({
      host: useEmulator,
      ssl: false,
    });
  }
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(collection: string, id?: string, query?: string): string {
  return query ? `${collection}:${query}` : `${collection}:${id || "all"}`;
}

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

export const firestore = db;

export async function getUserByFirebaseUid(uid: string) {
  const cacheKey = getCacheKey("users", uid);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection("users").where("firebaseUid", "==", uid).limit(1).get();
    if (snapshot.empty) return null;

    const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    setCache(cacheKey, user);
    return user;
  } catch (error: any) {
    if (error?.code === 5 || error?.code === "NOT_FOUND") {
      console.warn("Firestore database not found. Please create the database in Firebase Console.");
    } else {
      console.warn("Error fetching user by Firebase UID:", error);
    }
    return null;
  }
}

export async function getUserById(id: string) {
  const cacheKey = getCacheKey("users", id);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const doc = await db.collection("users").doc(id).get();
  if (!doc.exists) return null;

  const user = { id: doc.id, ...doc.data() };
  setCache(cacheKey, user);
  return user;
}

export async function getUserByReferralCode(code: string) {
  const cacheKey = getCacheKey("users", undefined, `referralCode:${code}`);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection("users").where("referralCode", "==", code).limit(1).get();
    if (snapshot.empty) return null;

    const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    setCache(cacheKey, user);
    return user;
  } catch (error) {
    console.warn("Error fetching user by referral code:", error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  const cacheKey = getCacheKey("users", undefined, `email:${email}`);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snapshot.empty) return null;

    const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    setCache(cacheKey, user);
    return user;
  } catch (error) {
    console.warn("Error fetching user by email:", error);
    return null;
  }
}

export async function createUser(data: any) {
  try {
    const now = new Date();
    const docRef = await db.collection("users").add({
      ...data,
      walletBalance: 0,
      createdAt: now,
      updatedAt: now,
    });
    invalidateCache("users:");
    return { id: docRef.id, ...data, walletBalance: 0, createdAt: now, updatedAt: now };
  } catch (error: any) {
    if (error?.code === 5 || error?.code === "NOT_FOUND") {
      const errorMsg = "Firestore database not found. Please create a Native mode database in Firebase Console: https://console.firebase.google.com";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    console.error("Error creating user:", error);
    throw error;
  }
}


export async function ensureUserExists(uid: string, userData?: { email?: string; name?: string; photoURL?: string }) {
  let user = await getUserByFirebaseUid(uid);
  
  if (!user) {
    let email = userData?.email;
    let name = userData?.name;
    let photoURL = userData?.photoURL;
    
    if (!email || !name) {
      try {
        const auth = getAuth(app);
        const firebaseUser = await auth.getUser(uid);
        email = email || firebaseUser.email || "";
        name = name || firebaseUser.displayName || "";
        photoURL = photoURL || firebaseUser.photoURL || "";
      } catch (error) {
        console.warn("Could not fetch user from Firebase Auth:", error);
      }
    }
    
    if (!email) {
      email = `${uid}@temp.com`;
    }
    
    const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      user = await createUser({
        firebaseUid: uid,
        email,
        name: name || "User",
        photoURL: photoURL || "",
        referralCode: newReferralCode,
        referredById: null,
        role: "USER",
      });
    } catch (error: any) {
      if (error?.code === 5 || error?.code === "NOT_FOUND" || error?.message?.includes("Firestore database")) {
        const errorMsg = `
╔══════════════════════════════════════════════════════════════╗
║  FIRESTORE DATABASE NOT FOUND                                ║
╠══════════════════════════════════════════════════════════════╣
║  Please create a Firestore database in Firebase Console:     ║
║  1. Go to https://console.firebase.google.com                 ║
║  2. Select your project                                      ║
║  3. Go to Firestore Database                                 ║
║  4. Click "Create database"                                  ║
║  5. Choose "Start in production mode" or "Start in test mode"║
║  6. Select a location                                        ║
║  7. Enable the database                                      ║
╚══════════════════════════════════════════════════════════════╝
        `;
        console.error(errorMsg);
        throw new Error("Firestore database not found. Please create a Native mode database in Firebase Console. See console for details.");
      }
      throw error;
    }
  }
  
  return user;
}

export async function updateUser(id: string, data: any) {
  await db.collection("users").doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
  invalidateCache("users:");
  return getUserById(id);
}

export async function updateWalletBalance(id: string, amount: number, operation: "increment" | "set" = "increment") {
  const userRef = db.collection("users").doc(id);
  
  if (operation === "increment") {
    await userRef.update({
      walletBalance: FieldValue.increment(amount),
      updatedAt: new Date(),
    });
  } else {
    await userRef.update({
      walletBalance: amount,
      updatedAt: new Date(),
    });
  }
  invalidateCache("users:");
}

export async function getPlans() {
  const cacheKey = getCacheKey("plans");
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const snapshot = await db.collection("plans").get();
  const plans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  setCache(cacheKey, plans);
  return plans;
}

export async function getPlan(id: string) {
  const cacheKey = getCacheKey("plans", id);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const doc = await db.collection("plans").doc(id).get();
  if (!doc.exists) return null;

  const plan = { id: doc.id, ...doc.data() };
  setCache(cacheKey, plan);
  return plan;
}

export async function createPlan(data: any) {
  const docRef = await db.collection("plans").add(data);
  invalidateCache("plans:");
  return { id: docRef.id, ...data };
}

export async function createPurchase(data: any) {
  const now = new Date();
  const docRef = await db.collection("purchases").add({
    ...data,
    createdAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now };
}

export async function getPurchase(id: string) {
  const doc = await db.collection("purchases").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createTransaction(data: any) {
  const now = new Date();
  const docRef = await db.collection("transactions").add({
    ...data,
    createdAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now };
}

export async function getTransactions(userId: string, limit: number = 10) {
  const snapshot = await db
    .collection("transactions")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getReferrals(userId: string, depth: number = 3) {
  const cacheKey = getCacheKey("referrals", userId, `depth:${depth}`);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  async function getReferralsRecursive(id: string, currentDepth: number): Promise<any[]> {
    if (currentDepth <= 0) return [];

    const snapshot = await db.collection("users").where("referredById", "==", id).get();
    const referrals = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const user = { id: doc.id, ...doc.data() };
        const nested = await getReferralsRecursive(doc.id, currentDepth - 1);
        return { ...user, referrals: nested };
      })
    );
    return referrals;
  }

  const referrals = await getReferralsRecursive(userId, depth);
  setCache(cacheKey, referrals);
  return referrals;
}

export async function getUplineChain(userId: string): Promise<string[]> {
  const chain: string[] = [];
  let currentId: string | null = userId;

  while (currentId) {
    const user = await getUserById(currentId);
    if (!user || !user.referredById) break;
    chain.push(user.referredById);
    currentId = user.referredById;
  }

  return chain;
}

