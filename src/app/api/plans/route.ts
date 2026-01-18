import { getPlans, createPlan } from "@/lib/firebase-db";
import { NextResponse } from "next/server";

export async function GET() {
  let plans = await getPlans();

  if (plans.length === 0) {
    await createPlan({
      name: "Starter",
      price: 500,
      levelCount: 3,
      levelPercentages: JSON.stringify({ "1": 0.1, "2": 0.05, "3": 0.02 }),
    });
    await createPlan({
      name: "Pro",
      price: 1000,
      levelCount: 5,
      levelPercentages: JSON.stringify({ "1": 0.15, "2": 0.1, "3": 0.05, "4": 0.02, "5": 0.01 }),
    });
    plans = await getPlans();
  }

  return NextResponse.json({ plans });
}
