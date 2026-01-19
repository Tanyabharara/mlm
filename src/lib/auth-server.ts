import { adminAuth } from "./firebase-db";

export async function verifyAuthToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring("Bearer ".length).trim();
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    console.error("Failed to verify Firebase ID token:", error);
    return null;
  }
}


