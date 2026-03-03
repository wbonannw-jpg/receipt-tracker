import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        let categories = await prisma.category.findMany({
            where: { userId },
            include: { subCategories: true },
            orderBy: { createdAt: "asc" }
        });

        // Seed default categories for new users
        if (categories.length === 0) {
            for (const catName of CATEGORIES) {
                const newCat = await prisma.category.create({
                    data: { name: catName, userId }
                });
                const subs = CATEGORY_MAP[catName as keyof typeof CATEGORY_MAP] || [];
                for (const subName of subs) {
                    await prisma.subCategory.create({
                        data: { name: subName, categoryId: newCat.id }
                    });
                }
            }
            categories = await prisma.category.findMany({
                where: { userId },
                include: { subCategories: true },
                orderBy: { createdAt: "asc" }
            });
        }

        categories.sort((a, b) => {
            const indexA = CATEGORIES.indexOf(a.name);
            const indexB = CATEGORIES.indexOf(b.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1 && indexB === -1) return -1;
            if (indexA === -1 && indexB !== -1) return 1;
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    try {
        const body = await req.json();
        const { name } = body;

        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const newCategory = await prisma.category.create({
            data: { name, userId },
            include: { subCategories: true }
        });

        revalidatePath("/settings");
        revalidatePath("/");
        return NextResponse.json(newCategory);
    } catch (error: any) {
        console.error("Error creating category:", error);
        if (error.code === "P2002") {
            return NextResponse.json({ error: "同じ名前のカテゴリが既に存在します" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
