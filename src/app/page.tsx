import prisma from "@/lib/prisma";
import Link from "next/link";
import { Camera, Home as HomeIcon, Settings, Percent } from "lucide-react";
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
        <h1 style={{ margin: 0 }}><HomeIcon size={28} /></h1>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <Link href="/sales" className="btn btn-outline flex items-center justify-center gap-1" style={{ width: 'auto', padding: '0.4rem 0.6rem', color: 'var(--primary)', borderColor: 'var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
            <span className="font-bold text-sm">セール</span>
          </Link>
          <Link href="/settings" className="btn btn-outline flex items-center justify-center gap-1" style={{ width: 'auto', padding: '0.4rem 0.6rem' }}>
            <Settings size={18} />
            設定
          </Link>
          <Link href="/camera" className="btn btn-primary flex items-center justify-center gap-1" style={{ width: 'auto', padding: '0.4rem 0.6rem' }}>
            <Camera size={18} />
            追加
          </Link>
        </div>
      </div>
      <RecurringCheck />
      <CalendarView receipts={receipts} initialDate={initialDate} />
    </div>
  );
}
