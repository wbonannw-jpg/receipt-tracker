import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month");

        if (!month) return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });

        const income = await prisma.income.findUnique({
            where: { userId_month: { userId, month } }
        });

        return NextResponse.json({ income });
    } catch (error) {
        console.error("Fetch Income Error:", error);
        return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        const body = await req.json();
        const { month, amount } = body;

        if (!month || amount === undefined) {
            return NextResponse.json({ error: "Missing month or amount" }, { status: 400 });
        }

        const income = await prisma.income.upsert({
            where: { userId_month: { userId, month } },
            update: { amount: Number(amount) },
            create: { userId, month, amount: Number(amount) }
        });

        return NextResponse.json({ success: true, income });
    } catch (error) {
        console.error("Save Income Error:", error);
        return NextResponse.json({ error: "Failed to save income" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month");

        if (!month) return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });

        await prisma.income.deleteMany({ where: { userId, month } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Income Error:", error);
        return NextResponse.json({ error: "Failed to delete income" }, { status: 500 });
    }
}
