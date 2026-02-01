import { NextRequest, NextResponse } from "next/server";
import { getPaymentIntent } from "@/lib/firebase-db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ intentId: string }> }
) {
  try {
    const { intentId } = await params;

    const intent = await getPaymentIntent(intentId);

    if (!intent) {
      return NextResponse.json({ error: "Payment intent not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: intent.status,
      confirmations: intent.confirmations ?? 0,
      txHash: intent.txHash,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
