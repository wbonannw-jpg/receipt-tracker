import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        let categories = await prisma.category.findMany({
            include: { subCategories: true },
            orderBy: { createdAt: 'asc' }
        });

        // Seed default categories if empty
        if (categories.length === 0) {
            for (const catName of CATEGORIES) {
                const newCat = await prisma.category.create({
                    data: { name: catName }
                });
                const subs = CATEGORY_MAP[catName as keyof typeof CATEGORY_MAP] || [];
                for (const subName of subs) {
                    await prisma.subCategory.create({
                        data: { name: subName, categoryId: newCat.id }
                    });
                }
            }
            // Fetch again after seeding
            categories = await prisma.category.findMany({
                include: { subCategories: true },
                orderBy: { createdAt: 'asc' }
            });
        }

        // Sort categories logically based on CATEGORIES array order
        categories.sort((a, b) => {
            const indexA = CATEGORIES.indexOf(a.name);
            const indexB = CATEGORIES.indexOf(b.name);

            // Both are default categories
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            // A is default, B is custom (custom goes last)
            if (indexA !== -1 && indexB === -1) {
                return -1;
            }
            // B is default, A is custom
            if (indexA === -1 && indexB !== -1) {
                return 1;
            }
            // Both are custom, sort by createdAt (which is the original order)
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const newCategory = await prisma.category.create({
            data: { name },
            include: { subCategories: true }
        });

        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json(newCategory);
    } catch (error: any) {
        console.error("Error creating category:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "同じ名前のカテゴリが既に存在します" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
