import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;

        const rule = await prisma.customSaleRule.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!rule) {
            return NextResponse.json({ error: "Rule not found" }, { status: 404 });
        }

        await prisma.customSaleRule.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting custom rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
