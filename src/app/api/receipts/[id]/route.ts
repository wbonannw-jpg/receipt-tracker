import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        const data = await req.json();
        const { date, totalAmount, items } = data;

        if (!date || totalAmount === undefined) {
            return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
        }

        const finalItems = items.map((item: any) => ({
            name: item.name.trim() === "" ? "未入力" : item.name.trim(),
            price: Number(item.price),
            category: item.category || "未分類",
            subCategory: item.subCategory || null
        }));

        const updatedReceipt = await prisma.$transaction(async (tx) => {
            await tx.item.deleteMany({ where: { receiptId: id } });
            return await tx.receipt.update({
                where: { id, userId },
                data: {
                    date,
                    totalAmount: Number(totalAmount),
                    items: { create: finalItems }
                },
                include: { items: true }
            });
        });

        return NextResponse.json({ success: true, receipt: updatedReceipt });
    } catch (error: any) {
        console.error("Update Receipt Error:", error);
        return NextResponse.json({ error: "更新中にエラーが発生しました" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        await prisma.$transaction([
            prisma.item.deleteMany({ where: { receiptId: id } }),
            prisma.receipt.delete({ where: { id, userId } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Receipt Error:", error);
        return NextResponse.json({ error: "削除中にエラーが発生しました" }, { status: 500 });
    }
}
