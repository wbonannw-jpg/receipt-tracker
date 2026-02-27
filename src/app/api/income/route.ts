import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // Format "YYYY-MM"

        if (!month) {
            return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });
        }

        const income = await prisma.income.findUnique({
            where: { month }
        });

        return NextResponse.json({ income });
    } catch (error) {
        console.error("Fetch Income Error:", error);
        return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { month, amount } = body;

        if (!month || amount === undefined) {
            return NextResponse.json({ error: "Missing month or amount" }, { status: 400 });
        }

        const income = await prisma.income.upsert({
            where: { month },
            update: { amount: Number(amount) },
            create: { month, amount: Number(amount) }
        });

        return NextResponse.json({ success: true, income });
    } catch (error) {
        console.error("Save Income Error:", error);
        return NextResponse.json({ error: "Failed to save income" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month");

        if (!month) {
            return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });
        }

        await prisma.income.deleteMany({
            where: { month }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Income Error:", error);
        return NextResponse.json({ error: "Failed to delete income" }, { status: 500 });
    }
}
