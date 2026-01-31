import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

const DEFAULT_PERCENTAGES = {
    1: 0.10,
    2: 0.05,
    3: 0.01,
    4: 0.005,
    5: 0.005,
    6: 0.005,
    7: 0.005,
    8: 0.005,
    9: 0.005,
    10: 0.005
};

export async function GET(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        console.log("Finance Config GET Request - Auth User:", admin?.email, "Role:", admin?.role);
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const config = await prisma.appConfig.findUnique({
            where: { key: 'LEVEL_INCOME_CONFIG' }
        });

        const percentages = config ? JSON.parse(config.value) : DEFAULT_PERCENTAGES;

        return NextResponse.json({ percentages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdminRequest(req);
        console.log("Finance Config POST Request - Auth User:", admin?.email, "Role:", admin?.role);
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { percentages } = await req.json();

        if (!percentages || typeof percentages !== 'object') {
            return NextResponse.json({ error: "Invalid percentages format" }, { status: 400 });
        }

        await prisma.appConfig.upsert({
            where: { key: 'LEVEL_INCOME_CONFIG' },
            update: { value: JSON.stringify(percentages) },
            create: { key: 'LEVEL_INCOME_CONFIG', value: JSON.stringify(percentages) }
        });

        return NextResponse.json({ message: "Income configuration updated successfully", percentages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
