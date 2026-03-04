import prisma from "@/lib/prisma";
import Link from "next/link";
import { Camera, Settings } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import RecurringCheck from "@/components/RecurringCheck";
import UserMenu from "@/components/UserMenu";

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
        <h1 style={{ margin: 0 }}>ホーム</h1>
        <div className="flex gap-2 items-center">
          <Link href="/camera" className="btn btn-primary flex items-center justify-center gap-2" style={{ width: 'auto' }}>
            <Camera size={20} />
            撮影
          </Link>
          <UserMenu />
        </div>
      </div>
      <RecurringCheck />
      <CalendarView receipts={receipts} initialDate={initialDate} />
    </div>
  );
}
