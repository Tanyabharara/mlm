import { getUserByFirebaseUid, getPlan, getReferrals } from "@/lib/firebase-db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByFirebaseUid(uid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = user.planId ? await getPlan(user.planId) : null;
    const referrals = await getReferrals(user.id, 1);

    return NextResponse.json({
      user: {
        ...user,
        plan,
        referrals,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
