import { verifyAuthToken } from "./auth-server";
import { getUserByFirebaseUid } from "./firebase-db";

export async function verifyAdminRequest(req: Request) {
  const verifiedUid = await verifyAuthToken(req);
  if (!verifiedUid) return null;

  const user: any = await getUserByFirebaseUid(verifiedUid);

  if (user?.role !== "ADMIN") {
    if (user) {
      console.warn(`Unauthorized access attempt by ${user.email}. Role: ${user.role}`);
    }
    return null;
  }
  return user;
}
