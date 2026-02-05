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
export const adminApp = app;
export const adminAuth = getAuth(app);

export type FirestoreUser = {
  id: string;
  firebaseUid?: string;
  email?: string;
  name?: string;
  photoURL?: string;
  role?: string;
  referralCode?: string;
  referredById?: string | null;
  planId?: string | null;
  walletBalance?: number;
  isBlocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type FirestorePlan = { id: string; name?: string; price?: number; levelCount?: number; levelPercentages?: string };

export async function getUserByFirebaseUid(uid: string): Promise<FirestoreUser | null> {
  const cacheKey = getCacheKey("users", uid);
  const cached = getCached<FirestoreUser>(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection("users").where("firebaseUid", "==", uid).limit(1).get();
    if (snapshot.empty) return null;

    const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FirestoreUser;
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

export async function getUserById(id: string): Promise<FirestoreUser | null> {
  const cacheKey = getCacheKey("users", id);
  const cached = getCached<FirestoreUser>(cacheKey);
  if (cached) return cached;

  const doc = await db.collection("users").doc(id).get();
  if (!doc.exists) return null;

  const user = { id: doc.id, ...doc.data() } as FirestoreUser;
  setCache(cacheKey, user);
  return user;
}

export async function getUserByReferralCode(code: string): Promise<FirestoreUser | null> {
  const cacheKey = getCacheKey("users", undefined, `referralCode:${code}`);
  const cached = getCached<FirestoreUser>(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection("users").where("referralCode", "==", code).limit(1).get();
    if (snapshot.empty) return null;

    const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FirestoreUser;
    setCache(cacheKey, user);
    return user;
  } catch (error) {
    console.warn("Error fetching user by referral code:", error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<FirestoreUser | null> {
  const cacheKey = getCacheKey("users", undefined, `email:${email}`);
  const cached = getCached<FirestoreUser>(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snapshot.empty) return null;

    const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FirestoreUser;
    setCache(cacheKey, user);
    return user;
  } catch (error) {
    console.warn("Error fetching user by email:", error);
    return null;
  }
}

async function generateUniqueReferralCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await getUserByReferralCode(code);
    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error("Failed to generate unique referral code after multiple attempts");
}

export async function createUser(data: any): Promise<FirestoreUser> {
  try {
    if (data.email) {
      const existingUser = await getUserByEmail(data.email);
      if (existingUser) {
        throw new Error(`User with email ${data.email} already exists`);
      }
    }

    if (data.firebaseUid) {
      const existingUser = await getUserByFirebaseUid(data.firebaseUid);
      if (existingUser) {
        throw new Error(`User with Firebase UID ${data.firebaseUid} already exists`);
      }
    }

    if (!data.referralCode) {
      data.referralCode = await generateUniqueReferralCode();
    } else {
      const existingUser = await getUserByReferralCode(data.referralCode);
      if (existingUser) {
        throw new Error(`Referral code ${data.referralCode} already exists`);
      }
    }

    const now = new Date();
    const docRef = await db.collection("users").add({
      ...data,
      walletBalance: 0,
      createdAt: now,
      updatedAt: now,
    });
    invalidateCache("users:");

    if (data.referredById) {
      invalidateCache(`referrals:${data.referredById}:`);
    }

    return { id: docRef.id, ...data, walletBalance: 0, createdAt: now, updatedAt: now } as FirestoreUser;
  } catch (error: any) {
    if (error?.code === 5 || error?.code === "NOT_FOUND") {
      const errorMsg = "Firestore database not found. Please create a Native mode database in Firebase Console: https://console.firebase.google.com";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    if (error?.message?.includes("already exists")) {
      throw error;
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

    if (email && email !== `${uid}@temp.com`) {
      const existingUserByEmail = await getUserByEmail(email);
      if (existingUserByEmail) {
        if ((existingUserByEmail as any).firebaseUid === uid) {
          return existingUserByEmail;
        }
        throw new Error(`Email ${email} is already associated with another account`);
      }
    }

    try {
      user = await createUser({
        firebaseUid: uid,
        email,
        name: name || "User",
        photoURL: photoURL || "",
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
      if (error?.message?.includes("already exists")) {
        throw error;
      }
      throw error;
    }
  }

  return user;
}

export async function updateUser(id: string, data: any) {
  const user = await getUserById(id);
  if (!user) {
    throw new Error("User not found");
  }

  const userData = user as any;

  if (data.email && data.email !== userData.email) {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser && (existingUser as any).id !== id) {
      throw new Error(`Email ${data.email} is already associated with another account`);
    }
  }

  if (data.referralCode && data.referralCode !== userData.referralCode) {
    const existingUser = await getUserByReferralCode(data.referralCode);
    if (existingUser && (existingUser as any).id !== id) {
      throw new Error(`Referral code ${data.referralCode} is already in use`);
    }
  }

  if (data.referredById && userData.referredById && data.referredById !== userData.referredById) {
    throw new Error("User can only be referred by one person. Referrer cannot be changed.");
  }

  await db.collection("users").doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
  invalidateCache("users:");

  if (data.referredById) {
    invalidateCache(`referrals:${data.referredById}:`);
  }

  if (userData.referredById && data.referredById !== userData.referredById) {
    invalidateCache(`referrals:${userData.referredById}:`);
  }

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

export async function getPlans(): Promise<FirestorePlan[]> {
  const cacheKey = getCacheKey("plans");
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const snapshot = await db.collection("plans").get();
  const plans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestorePlan));
  setCache(cacheKey, plans);
  return plans;
}

export async function getPlan(id: string): Promise<FirestorePlan | null> {
  const cacheKey = getCacheKey("plans", id);
  const cached = getCached<FirestorePlan>(cacheKey);
  if (cached) return cached;

  const doc = await db.collection("plans").doc(id).get();
  if (!doc.exists) return null;

  const plan = { id: doc.id, ...doc.data() } as FirestorePlan;
  setCache(cacheKey, plan);
  return plan;
}

export async function createPlan(data: any) {
  const docRef = await db.collection("plans").add(data);
  invalidateCache("plans:");
  return { id: docRef.id, ...data };
}

export async function updatePlan(id: string, data: Partial<{ name: string; price: number; levelCount: number; levelPercentages: string }>) {
  await db.collection("plans").doc(id).update(data as any);
  invalidateCache("plans:");
}

export async function setPlan(id: string, data: { name: string; price: number; levelCount: number; levelPercentages: string }) {
  await db.collection("plans").doc(id).set({ id, ...data }, { merge: true });
  invalidateCache("plans:");
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
  try {
    const snapshot = await db
      .collection("transactions")
      .where("userId", "==", userId)
      .limit(500)
      .get();
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
    docs.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime();
      const tb = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime();
      return tb - ta;
    });
    return docs.slice(0, limit);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function getAllTransactions(limit: number = 50) {
  try {
    const snapshot = await db
      .collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    return [];
  }
}

export async function getReferrals(userId: string, depth: number = 3) {
  const cacheKey = getCacheKey("referrals", userId, `depth:${depth}`);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
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
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return [];
  }
}

export async function getDirectReferrals(userId: string, limit: number = 50): Promise<any[]> {
  const snapshot = await db
    .collection("users")
    .where("referredById", "==", userId)
    .limit(500)
    .get();
  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
  docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime();
    const tb = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime();
    return tb - ta;
  });
  return docs.slice(0, limit);
}

export async function getUplineChain(userId: string): Promise<string[]> {
  const chain: string[] = [];
  let currentId: string | null = userId;

  while (currentId) {
    const user = await getUserById(currentId);
    if (!user) break;
    const userData = user as any;
    if (!userData.referredById) break;
    chain.push(userData.referredById);
    currentId = userData.referredById;
  }

  return chain;
}

export async function getAppConfig(key: string): Promise<{ key: string; value: string } | null> {
  const cacheKey = getCacheKey("appConfig", key);
  const cached = getCached<{ key: string; value: string }>(cacheKey);
  if (cached) return cached;

  const doc = await db.collection("appConfig").doc(key).get();
  if (!doc.exists) return null;
  const data = { key: doc.id, value: (doc.data() as any)?.value ?? "" };
  setCache(cacheKey, data);
  return data;
}

export async function setAppConfig(key: string, value: string): Promise<void> {
  await db.collection("appConfig").doc(key).set({ key, value }, { merge: true });
  invalidateCache("appConfig:");
}

export async function updatePlatformPoolBalance(amount: number, type: "increment" | "decrement"): Promise<void> {
  const configRef = db.collection("appConfig").doc("PLATFORM_POOL_BALANCE");
  const doc = await configRef.get();
  const currentBalance = doc.exists ? parseFloat((doc.data() as any).value || "0") : 0;
  const newBalance = type === "increment" ? currentBalance + amount : currentBalance - amount;
  await configRef.set({ key: "PLATFORM_POOL_BALANCE", value: String(newBalance.toFixed(2)) }, { merge: true });
  invalidateCache("appConfig:");
}

export async function logSystemPayout(recipientUserId: string, amount: number, category: string, description: string) {
  // 1. Credit User
  await updateWalletBalance(recipientUserId, amount, "increment");
  await createTransaction({
    userId: recipientUserId,
    amount: amount,
    type: "CREDIT",
    category: category,
    description: description,
  });

  // 2. Debit Admin Pool
  await updatePlatformPoolBalance(amount, "decrement");

  const admin = await getFirstAdminUser();
  if (admin) {
    const recipient: any = await getUserById(recipientUserId);
    await createTransaction({
      userId: admin.id,
      amount: amount,
      type: "DEBIT",
      category: category,
      description: `Payout to ${recipient?.name || recipientUserId}: ${description}`,
    });
  }
}

export async function getAutoPools(): Promise<any[]> {
  const snapshot = await db.collection("autoPools").get();
  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  list.sort((a, b) => {
    const na = Number(a.id);
    const nb = Number(b.id);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a.id).localeCompare(String(b.id));
  });
  return list;
}

export async function getAutoPool(id: string): Promise<any | null> {
  const doc = await db.collection("autoPools").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function setAutoPool(id: string, data: { name: string; entryFee: number; matrixWidth?: number; matrixDepth?: number; reward?: number }) {
  await db.collection("autoPools").doc(id).set({ id, ...data }, { merge: true });
}

export async function getAutoPoolEntriesByPool(poolId: string): Promise<any[]> {
  const snapshot = await db
    .collection("autoPoolEntries")
    .where("poolId", "==", poolId)
    .get();
  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
  docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime();
    const tb = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime();
    return ta - tb;
  });
  return docs;
}

export async function countAutoPoolEntryChildren(entryId: string): Promise<number> {
  const snapshot = await db.collection("autoPoolEntries").where("parentId", "==", entryId).get();
  return snapshot.size;
}

export async function createAutoPoolEntry(data: {
  userId: string;
  poolId: string;
  parentId: string | null;
  level: number;
}): Promise<any> {
  const now = new Date();
  const docRef = await db.collection("autoPoolEntries").add({
    ...data,
    isCompleted: false,
    completedAt: null,
    heldIncome: 0,
    createdAt: now,
  });
  return { id: docRef.id, ...data, isCompleted: false, completedAt: null, heldIncome: 0, createdAt: now };
}

export async function updateAutoPoolEntryHeldIncome(id: string, amount: number): Promise<void> {
  const entryRef = db.collection("autoPoolEntries").doc(id);
  await entryRef.update({
    heldIncome: FieldValue.increment(amount),
    updatedAt: new Date(),
  });
}

export async function getAutoPoolEntry(id: string): Promise<any | null> {
  const doc = await db.collection("autoPoolEntries").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function getAutoPoolEntryByUserAndPool(userId: string, poolId: string): Promise<any | null> {
  const snapshot = await db
    .collection("autoPoolEntries")
    .where("userId", "==", userId)
    .where("poolId", "==", poolId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getAutoPoolEntriesByUser(userId: string): Promise<any[]> {
  const snapshot = await db
    .collection("autoPoolEntries")
    .where("userId", "==", userId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAutoPoolEntryChildren(entryId: string): Promise<any[]> {
  const snapshot = await db
    .collection("autoPoolEntries")
    .where("parentId", "==", entryId)
    .get();
  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
  docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime();
    const tb = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime();
    return ta - tb;
  });
  return docs;
}

export async function countAutoPoolEntriesByPool(poolId: string): Promise<number> {
  const snapshot = await db.collection("autoPoolEntries").where("poolId", "==", poolId).get();
  return snapshot.size;
}

export async function updateAutoPoolEntry(id: string, data: Partial<{ isCompleted: boolean; completedAt: Date | null }>): Promise<void> {
  await db.collection("autoPoolEntries").doc(id).update(data as any);
}

export async function getPaymentIntent(id: string): Promise<any | null> {
  const doc = await db.collection("paymentIntents").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createPaymentIntent(data: {
  userId: string;
  amount: number;
  token?: string;
  network?: string;
  status?: string;
}): Promise<any> {
  const now = new Date();
  const payload = {
    ...data,
    token: data.token ?? "USDT",
    network: data.network ?? "BSC",
    status: data.status ?? "INITIATED",
    txHash: null,
    confirmations: 0,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await db.collection("paymentIntents").add(payload);
  return { id: ref.id, ...payload };
}

export async function createPaymentIntentWithId(id: string, data: {
  userId: string;
  amount: number;
  token?: string;
  network?: string;
  status?: string;
}): Promise<any> {
  const now = new Date();
  const payload = {
    ...data,
    token: data.token ?? "USDT",
    network: data.network ?? "BSC",
    status: data.status ?? "INITIATED",
    txHash: null,
    confirmations: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("paymentIntents").doc(id).set(payload);
  return { id, ...payload };
}

export async function updatePaymentIntent(id: string, data: Partial<{ status: string; txHash: string | null; confirmations: number }>): Promise<void> {
  await db.collection("paymentIntents").doc(id).update({ ...data, updatedAt: new Date() } as any);
}

export async function getMilestonesByUser(userId: string): Promise<any[]> {
  const snapshot = await db.collection("milestones").where("userId", "==", userId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function createMilestone(data: { userId: string; slab: number; amount: number;[key: string]: any }): Promise<any> {
  const now = new Date();
  const docRef = await db.collection("milestones").add({
    ...data,
    createdAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now };
}

export async function getOttSubscriptionsByUser(userId: string): Promise<any[]> {
  const snapshot = await db.collection("ottSubscriptions").where("userId", "==", userId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function createOttSubscription(data: {
  userId: string;
  platform: string;
  username?: string;
  password?: string;
  link?: string;
  status?: string;
  paymentIntentId?: string;
}): Promise<any> {
  const now = new Date();
  const docRef = await db.collection("ottSubscriptions").add({
    ...data,
    status: data.status ?? "PENDING",
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...data, status: data.status ?? "PENDING", createdAt: now, updatedAt: now };
}

export async function getOttSubscriptionById(id: string): Promise<any | null> {
  const doc = await db.collection("ottSubscriptions").doc(id).get();
  if (!doc.exists) return null;
  const subscription = { id: doc.id, ...doc.data() } as any;

  // Try to join with payment intent if it exists
  if (subscription.paymentIntentId) {
    subscription.paymentIntent = await getPaymentIntent(subscription.paymentIntentId);
  }

  return subscription;
}

export async function updateOttSubscription(id: string, data: any): Promise<void> {
  await db.collection("ottSubscriptions").doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
}

export async function getAllOttSubscriptions(limit: number = 100): Promise<any[]> {
  const snapshot = await db.collection("ottSubscriptions").orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}


export async function getFirstAdminUser(): Promise<FirestoreUser | null> {
  const snapshot = await db.collection("users").where("role", "==", "ADMIN").limit(1).get();
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as FirestoreUser;
}

export async function countUsersByReferredById(referredById: string): Promise<number> {
  const snapshot = await db.collection("users").where("referredById", "==", referredById).get();
  return snapshot.size;
}

export async function getUsersByReferredById(referredById: string): Promise<any[]> {
  const snapshot = await db.collection("users").where("referredById", "==", referredById).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getRecentPaymentIntents(limit: number = 20): Promise<any[]> {
  const snapshot = await db
    .collection("paymentIntents")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getUsersWithPlan(): Promise<any[]> {
  const snapshot = await db.collection("users").where("planId", ">", "").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAllUsers(): Promise<any[]> {
  const snapshot = await db.collection("users").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function milestoneExists(userId: string, slab: number): Promise<boolean> {
  const snapshot = await db
    .collection("milestones")
    .where("userId", "==", userId)
    .where("slab", "==", slab)
    .limit(1)
    .get();
  return !snapshot.empty;
}

export async function getTotalMilestonePayouts(): Promise<number> {
  const snapshot = await db.collection("milestones").get();
  return snapshot.docs.reduce((acc, doc) => acc + (Number(doc.data().amount) || 0), 0);
}

export async function createWithdrawalRequest(data: { userId: string; amount: number }): Promise<any> {
  const now = new Date();
  const docRef = await db.collection("withdrawalRequests").add({
    ...data,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...data, status: "PENDING", createdAt: now, updatedAt: now };
}

export async function getWithdrawalRequestsByUser(userId: string): Promise<any[]> {
  const snapshot = await db
    .collection("withdrawalRequests")
    .where("userId", "==", userId)
    .get();

  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return docs.sort((a: any, b: any) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getAllWithdrawalRequests(limit: number = 100): Promise<any[]> {
  const snapshot = await db
    .collection("withdrawalRequests")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getWithdrawalRequestById(id: string): Promise<any | null> {
  const doc = await db.collection("withdrawalRequests").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updateWithdrawalRequest(id: string, data: any): Promise<void> {
  await db.collection("withdrawalRequests").doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
}
