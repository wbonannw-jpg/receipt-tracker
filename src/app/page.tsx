import prisma from "@/lib/prisma";
import Link from "next/link";
import { Camera, Settings } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import RecurringCheck from "@/components/RecurringCheck";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const initialDate = typeof resolvedParams.date === 'string' ? resolvedParams.date : undefined;

  // Fetch all receipts to populate the calendar
  const receipts = await prisma.receipt.findMany({
    orderBy: { date: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ marginBottom: 0 }}>ホーム</h1>
          <p className="text-muted">最近の支出状況</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings" className="btn btn-outline flex items-center justify-center gap-2" style={{ width: 'auto' }}>
            <Settings size={20} />
            設定
          </Link>
          <Link href="/camera" className="btn btn-primary" style={{ width: 'auto' }}>
            <Camera size={20} />
            レシート追加
          </Link>
        </div>
      </div>
      <RecurringCheck />
      <CalendarView receipts={receipts} initialDate={initialDate} />
    </div>
  );
}
