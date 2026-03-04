import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        const resolvedParams = await params;
        const body = await req.json();
        const { name, amount, category, subCategory } = body;

        const updatedEntry = await prisma.recurringEntry.update({
            where: { id: resolvedParams.id, userId },
            data: { name, amount: Number(amount), category, subCategory: subCategory || null }
        });

        revalidatePath("/settings");
        revalidatePath("/");
        return NextResponse.json(updatedEntry);
    } catch (error) {
        console.error("Error updating recurring entry:", error);
        return NextResponse.json({ error: "Failed to update recurring entry" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        const resolvedParams = await params;

        // 削除前に固定費の情報を取得
        const entry = await prisma.recurringEntry.findUnique({
            where: { id: resolvedParams.id, userId }
        });

        if (!entry) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // 当月の文字列（例: "2026-03"）
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const firstDayOfMonth = `${yearMonth}-01`;

        // 当月の自動生成レシートから、この固定費に対応するItemを削除
        const affectedItems = await prisma.item.findMany({
            where: {
                name: entry.name,
                price: entry.amount,
                category: entry.category,
                receipt: {
                    userId,
                    date: firstDayOfMonth,
                }
            },
            include: { receipt: true }
        });

        for (const item of affectedItems) {
            // Itemを削除
            await prisma.item.delete({ where: { id: item.id } });

            // 残りItemを確認
            const remainingItems = await prisma.item.findMany({
                where: { receiptId: item.receiptId }
            });

            if (remainingItems.length === 0) {
                // Itemが0件になったらReceiptごと削除
                await prisma.receipt.delete({ where: { id: item.receiptId } });
            } else {
                // 合計金額を再計算して更新
                const newTotal = remainingItems.reduce((sum, i) => sum + i.price, 0);
                await prisma.receipt.update({
                    where: { id: item.receiptId },
                    data: { totalAmount: newTotal }
                });
            }
        }

        // RecurringHistoryを削除（次回アクセス時に残りの固定費で再計算させる）
        await prisma.recurringHistory.deleteMany({
            where: { month: yearMonth }
        });

        // 固定費エントリを削除
        await prisma.recurringEntry.delete({ where: { id: resolvedParams.id, userId } });

        revalidatePath("/settings");
        revalidatePath("/");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting recurring entry:", error);
        return NextResponse.json({ error: "Failed to delete recurring entry" }, { status: 500 });
    }
}
