import { NextResponse } from "next/server";
import { processMilestones } from "@/lib/milestone-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    // In production, you should protect this route with a secret key
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    try {
        await processMilestones();
        return NextResponse.json({ success: true, message: "Milestones processed successfully" });
    } catch (error: any) {
        console.error("Milestone Cron Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
