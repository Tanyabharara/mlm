import { verifyAuthToken } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { getUserByFirebaseUid, getOttSubscriptionsByUser } from "@/lib/firebase-db";

export async function GET(req: Request) {
  try {
    const verifiedUid = await verifyAuthToken(req);

    if (!verifiedUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByFirebaseUid(verifiedUid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscriptions = await getOttSubscriptionsByUser(user.id);
    const now = new Date();

    const processedSubscriptions = subscriptions.map((s: any) => {
      let status = s.status;
      const expiresAt = s.expiresAt ? (s.expiresAt.toDate ? s.expiresAt.toDate() : new Date(s.expiresAt)) : null;

      if (status === "ACTIVE" && expiresAt && expiresAt < now) {
        status = "EXPIRED";
      }

      return { ...s, status, expiresAt };
    });

    processedSubscriptions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ subscriptions: processedSubscriptions });
  } catch (error: any) {
    console.error("[API User OTT] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
