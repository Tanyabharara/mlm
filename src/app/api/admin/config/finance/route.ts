import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAppConfig, setAppConfig } from "@/lib/firebase-db";

const DEFAULT_PERCENTAGES = {
  1: 0.1,
  2: 0.05,
  3: 0.01,
  4: 0.005,
  5: 0.005,
  6: 0.005,
  7: 0.005,
  8: 0.005,
  9: 0.005,
  10: 0.005,
};

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const config = await getAppConfig("LEVEL_INCOME_CONFIG");
    const percentages = config ? JSON.parse(config.value) : DEFAULT_PERCENTAGES;

    return NextResponse.json({ percentages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { percentages } = await req.json();

    if (!percentages || typeof percentages !== "object") {
      return NextResponse.json({ error: "Invalid percentages format" }, { status: 400 });
    }

    await setAppConfig("LEVEL_INCOME_CONFIG", JSON.stringify(percentages));

    return NextResponse.json({ message: "Income configuration updated successfully", percentages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
