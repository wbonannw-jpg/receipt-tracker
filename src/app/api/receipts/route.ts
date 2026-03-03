import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const data = await req.json();
        const { date, totalAmount, items } = data;

        if (!date || totalAmount === undefined) {
            return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
        }

        const receipt = await prisma.receipt.create({
            data: {
                userId,
                date,
                totalAmount: Number(totalAmount),
                items: {
                    create: items.map((item: any) => ({
                        name: item.name,
                        price: Number(item.price),
                        category: item.category || "未分類",
                        subCategory: item.subCategory || null
                    })),
                },
            },
        });

        return NextResponse.json({ success: true, receipt });
    } catch (error: any) {
        console.error("Save Receipt Error:", error);
        return NextResponse.json({ error: "保存中にエラーが発生しました" }, { status: 500 });
    }
}
