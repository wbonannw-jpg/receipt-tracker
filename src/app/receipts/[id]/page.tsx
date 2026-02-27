import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, Receipt } from "lucide-react";
import { notFound } from "next/navigation";

import EditableReceipt from "@/components/EditableReceipt";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15 compatibility for params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const receipt = await prisma.receipt.findUnique({
        where: { id },
        include: { items: true },
    });

    if (!receipt) {
        notFound();
    }

    return <EditableReceipt initialReceipt={receipt} />;
}
