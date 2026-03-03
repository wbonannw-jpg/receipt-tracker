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
        await prisma.recurringEntry.delete({ where: { id: resolvedParams.id, userId } });

        revalidatePath("/settings");
        revalidatePath("/");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting recurring entry:", error);
        return NextResponse.json({ error: "Failed to delete recurring entry" }, { status: 500 });
    }
}
