import { ensureUserExists, getPlan, getReferrals } from "@/lib/firebase-db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { uid, email, name, photoURL } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureUserExists(uid, { email, name, photoURL });

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
