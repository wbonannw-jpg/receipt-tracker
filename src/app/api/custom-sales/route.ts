import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rules = await prisma.customSaleRule.findMany({
            where: { user: { email: session.user.email } },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ rules });
    } catch (error) {
        console.error("Error fetching custom rules:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { storeName, saleDay, description } = body;

        if (!storeName || typeof saleDay !== 'number' || saleDay < 1 || saleDay > 31 || !description) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const newRule = await prisma.customSaleRule.create({
            data: {
                storeName,
                saleDay,
                description,
                user: { connect: { email: session.user.email } }
            }
        });

        return NextResponse.json(newRule, { status: 201 });
    } catch (error: any) {
        console.error("Error creating custom rule:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "同じお店の同じ日付のルールは既に登録されています" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
