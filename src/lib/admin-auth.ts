import { verifyAuthToken } from "./auth-server";
import { getUserByFirebaseUid } from "./firebase-db";

export async function verifyAdminRequest(req: Request) {
  const verifiedUid = await verifyAuthToken(req);
  if (!verifiedUid) return null;

  const user: any = await getUserByFirebaseUid(verifiedUid);

  const MASTER_ADMIN = "tanyabharara333@gmail.com";

  if (user?.role !== "ADMIN" || user?.email !== MASTER_ADMIN) {
    if (user) {
      console.warn(`Unauthorized access attempt by ${user.email}. Only ${MASTER_ADMIN} is allowed.`);
    }
    return null;
  }
  return user;
}
