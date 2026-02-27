import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, categoryId } = body;

        if (!name || !categoryId) {
            return NextResponse.json({ error: "Name and Category ID are required" }, { status: 400 });
        }

        const newSubCategory = await prisma.subCategory.create({
            data: { name, categoryId }
        });

        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json(newSubCategory);
    } catch (error: any) {
        console.error("Error creating subcategory:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "同じ名前の小分類が既に存在します" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
    }
}
