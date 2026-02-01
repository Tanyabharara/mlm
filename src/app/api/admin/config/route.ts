import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAppConfig, setAppConfig, updatePlan, getPlans } from "@/lib/firebase-db";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await getAppConfig("PLATFORM_CONFIG");

    return NextResponse.json({ config: config ? JSON.parse(config.value) : {} });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    await setAppConfig("PLATFORM_CONFIG", JSON.stringify(body));

    if (body.planPrice != null) {
      const plans = await getPlans();
      const firstPlan = plans[0];
      if (firstPlan) {
        await updatePlan(firstPlan.id, { price: parseFloat(String(body.planPrice)) });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API Admin Config] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
