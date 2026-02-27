import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const updatedCategory = await prisma.category.update({
            where: { id: resolvedParams.id },
            data: { name },
            include: { subCategories: true }
        });

        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json(updatedCategory);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "同じ名前のカテゴリが既に存在します" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;

        // Delete all child subcategories first to prevent foreign key constraint violations
        await prisma.subCategory.deleteMany({
            where: { categoryId: resolvedParams.id }
        });

        await prisma.category.delete({
            where: { id: resolvedParams.id }
        });

        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE Category Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
    }
}
