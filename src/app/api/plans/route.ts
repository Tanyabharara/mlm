import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  let plans = await prisma.plan.findMany();
  
  if (plans.length === 0) {
      await prisma.plan.createMany({
          data: [
              { name: "Starter", price: 500, levelCount: 3, levelPercentages: JSON.stringify({ "1": 0.10, "2": 0.05, "3": 0.02 }) },
              { name: "Pro", price: 1000, levelCount: 5, levelPercentages: JSON.stringify({ "1": 0.15, "2": 0.10, "3": 0.05, "4": 0.02, "5": 0.01 }) },
          ]
      });
      plans = await prisma.plan.findMany();
  }
  
  return NextResponse.json({ plans });
}
