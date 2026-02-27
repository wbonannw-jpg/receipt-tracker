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

        // Fetch all recurring entries
        const recurringEntries = await prisma.recurringEntry.findMany();

        if (recurringEntries.length === 0) {
            return NextResponse.json({ message: "No recurring entries found", processed: false });
        }

        // Create a single receipt for all automated entries to group them
        // Alternatively, we could create one receipt per entry. 
        // For simplicity and clarity in the dashboard, we'll create a single "固定費" receipt for the 1st of the month.

        const firstDayOfMonth = `${year}-${month}-01`;
        const totalAmount = recurringEntries.reduce((sum, entry) => sum + entry.amount, 0);

        await prisma.$transaction(async (tx) => {
            // 1. Create Receipt
            const receipt = await tx.receipt.create({
                data: {
                    date: firstDayOfMonth,
                    totalAmount,
                }
            });

            // 2. Create Items
            const itemsData = recurringEntries.map(entry => ({
                receiptId: receipt.id,
                name: entry.name,
                price: entry.amount,
                category: entry.category,
                subCategory: entry.subCategory,
            }));

            await tx.item.createMany({
                data: itemsData
            });

            // 3. Mark as processed
            await tx.recurringHistory.create({
                data: { month: currentMonthString }
            });
        });

        return NextResponse.json({ message: "Successfully processed recurring entries", count: recurringEntries.length, processed: true });

    } catch (error) {
        console.error("Error processing recurring entries:", error);
        return NextResponse.json({ error: "Failed to process recurring entries" }, { status: 500 });
    }
}
