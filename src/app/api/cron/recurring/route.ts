import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const currentMonthString = `${year}-${month}`;

        // Check if recurring entries have been processed for this month
        const historyExists = await prisma.recurringHistory.findUnique({
            where: { month: currentMonthString }
        });

        if (historyExists) {
            return NextResponse.json({ message: "Already processed for this month", processed: false });
        }

        // Fetch all recurring entries grouped by userId
        const recurringEntries = await prisma.recurringEntry.findMany();

        if (recurringEntries.length === 0) {
            return NextResponse.json({ message: "No recurring entries found", processed: false });
        }

        // Group by userId
        const entriesByUser = recurringEntries.reduce((acc, entry) => {
            if (!acc[entry.userId]) acc[entry.userId] = [];
            acc[entry.userId].push(entry);
            return acc;
        }, {} as Record<string, typeof recurringEntries>);

        const firstDayOfMonth = `${year}-${month}-01`;

        await prisma.$transaction(async (tx) => {
            // Create one receipt per user
            for (const [userId, entries] of Object.entries(entriesByUser)) {
                const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

                const receipt = await tx.receipt.create({
                    data: {
                        userId,
                        date: firstDayOfMonth,
                        totalAmount,
                    }
                });

                const itemsData = entries.map(entry => ({
                    receiptId: receipt.id,
                    name: entry.name,
                    price: entry.amount,
                    category: entry.category,
                    subCategory: entry.subCategory,
                }));

                await tx.item.createMany({ data: itemsData });
            }

            // Mark as processed
            await tx.recurringHistory.create({
                data: { month: currentMonthString }
            });
        });

        return NextResponse.json({
            message: "Successfully processed recurring entries",
            count: recurringEntries.length,
            processed: true
        });

    } catch (error) {
        console.error("Error processing recurring entries:", error);
        return NextResponse.json({ error: "Failed to process recurring entries" }, { status: 500 });
    }
}
