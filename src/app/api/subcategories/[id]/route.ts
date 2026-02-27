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

        const updatedSubCategory = await prisma.subCategory.update({
            where: { id: resolvedParams.id },
            data: { name }
        });

        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json(updatedSubCategory);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "同じ名前の小分類が既に存在します" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;

        await prisma.subCategory.delete({
            where: { id: resolvedParams.id }
        });

        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE SubCategory Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete subcategory" }, { status: 500 });
    }
}
