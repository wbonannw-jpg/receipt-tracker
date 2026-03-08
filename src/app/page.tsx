import prisma from "@/lib/prisma";
import Link from "next/link";
import { Camera, Home as HomeIcon, Settings, Percent, Zap } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import RecurringCheck from "@/components/RecurringCheck";
import { getOnlineSales } from "@/lib/salesRules";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const initialDate = typeof resolvedParams.date === 'string' ? resolvedParams.date : undefined;

  // Check for active sales today
  let hasActiveSale = false;
  const today = new Date();

  // 1. Check online sales
  const onlineSales = getOnlineSales(today);
  if (onlineSales.some(sale => sale.isSaleToday)) {
    hasActiveSale = true;
  } else {
    // 2. Check custom rules for the logged-in user
    const session = await auth();
    if (session?.user?.id) {
      const todayDate = today.getDate();
      const customSale = await prisma.customSaleRule.findFirst({
        where: {
          userId: session.user.id,
          saleDay: todayDate,
        }
      });
      if (customSale) {
        hasActiveSale = true;
      }
    }
  }

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
          <Link
            href="/sales"
            className={`btn flex items-center justify-center gap-1 ${hasActiveSale ? '' : 'btn-outline'}`}
            style={{
              width: 'auto',
              padding: '0.4rem 0.6rem',
              ...(hasActiveSale ? {
                background: 'var(--destructive)',
                color: 'white',
                border: 'none',
                animation: 'pulse 2s infinite',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
              } : {
                color: 'var(--primary)',
                borderColor: 'var(--primary)',
                background: 'rgba(59, 130, 246, 0.05)'
              })
            }}
          >
            {hasActiveSale && <Zap size={16} fill="currentColor" />}
            <span className="font-bold text-sm">セール情報</span>
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
