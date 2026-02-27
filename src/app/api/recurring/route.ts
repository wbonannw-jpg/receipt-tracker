import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const recurringEntries = await prisma.recurringEntry.findMany({
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(recurringEntries);
    } catch (error) {
        console.error("Error fetching recurring entries:", error);
        return NextResponse.json({ error: "Failed to fetch recurring entries" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, amount, category, subCategory } = body;

        if (!name || amount === undefined || !category) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newEntry = await prisma.recurringEntry.create({
            data: {
                name,
                amount: Number(amount),
                category,
                subCategory: subCategory || null
            }
        });

        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json(newEntry);
    } catch (error) {
        console.error("Error creating recurring entry:", error);
        return NextResponse.json({ error: "Failed to create recurring entry" }, { status: 500 });
    }
}
