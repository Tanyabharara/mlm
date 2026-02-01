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
    subscriptions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error("[API User OTT] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
