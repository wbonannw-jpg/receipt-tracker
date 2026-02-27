"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import ExpensePieChart from "@/components/ExpensePieChart";

type Item = {
    id: string;
    name: string;
    price: number;
    category?: string;
};

type Receipt = {
    id: string;
    date: string;
    totalAmount: number;
    items: Item[];
};

export default function CalendarView({ receipts, initialDate }: { receipts: Receipt[], initialDate?: string }) {
    const [currentDate, setCurrentDate] = useState(() => {
        if (initialDate) {
            const parsed = new Date(initialDate);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        return new Date();
    });

    // Format YYYY-MM-DD
    const formatDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const todayStr = formatDateStr(new Date());

    const [selectedDateStr, setSelectedDateStr] = useState<string>(initialDate || todayStr);

    // Calendar logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const days: (Date | null)[] = [];
    // Padding for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    // Filter receipts for the selected date
    const selectedReceipts = receipts.filter(r => r.date === selectedDateStr);

    // Map of dates that have receipts to show indicators
    const receiptsByDate = receipts.reduce((acc, receipt) => {
        if (receipt.date) {
            acc[receipt.date] = (acc[receipt.date] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    // Calculate total amount for the current month
    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthlyTotal = receipts
        .filter(r => r.date.startsWith(currentMonthPrefix))
        .reduce((sum, r) => sum + r.totalAmount, 0);

    // Income state and fetch logic
    const [income, setIncome] = useState<number | null>(null);

    useEffect(() => {
        const fetchIncome = async () => {
            try {
                const res = await fetch(`/api/income?month=${currentMonthPrefix}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.income) {
                        setIncome(data.income.amount);
                    } else {
                        setIncome(null);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch income:", err);
            }
        };
        fetchIncome();
    }, [currentMonthPrefix]);

    return (
        <div className="flex flex-col gap-6 slide-up" style={{ animationDelay: "0.1s" }}>
            {/* Monthly Income & Expenses */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white' }}>
                <div className="flex justify-between items-start mb-4">
                    <h2 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem', margin: 0 }}>{month + 1}月の収支</h2>
                    {income === null && (
                        <Link
                            href="/settings"
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.875rem', textDecoration: 'none' }}
                        >
                            + 収入を設定
                        </Link>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>収入</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {income !== null ? `¥${income.toLocaleString()}` : "---"}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>支出</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            ¥{monthlyTotal.toLocaleString()}
                        </div>
                    </div>
                </div>

                {income !== null && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '1rem', opacity: 0.9 }}>残金 (収支)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: income - monthlyTotal < 0 ? '#ffb3b3' : 'white' }}>
                            ¥{(income - monthlyTotal).toLocaleString()}
                        </div>
                    </div>
                )}
            </div>

            {/* Expense Pie Chart */}
            <ExpensePieChart receipts={receipts.filter(r => r.date.startsWith(currentMonthPrefix))} />

            {/* Calendar Header */}
            <div className="card" style={{ padding: '1.5rem 1rem' }}>
                <div className="flex justify-between items-center mb-6">
                    <button onClick={prevMonth} className="btn btn-outline" style={{ padding: '0.4rem', width: 'auto' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{year}年 {month + 1}月</h2>
                    <button onClick={nextMonth} className="btn btn-outline" style={{ padding: '0.4rem', width: 'auto' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="calendar-grid">
                    {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                        <div key={day} className={`calendar-day-header text-center text-sm font-bold py-2 ${i === 0 ? 'text-destructive' : ''} ${i === 6 ? 'text-primary' : 'text-muted'}`}>
                            {day}
                        </div>
                    ))}
                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="calendar-cell empty"></div>;
                        }

                        const dateStr = formatDateStr(date);
                        const isSelected = dateStr === selectedDateStr;
                        const isToday = dateStr === todayStr;
                        const hasReceipts = !!receiptsByDate[dateStr];

                        return (
                            <button
                                key={dateStr}
                                onClick={() => setSelectedDateStr(dateStr)}
                                className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                style={{ backgroundColor: (hasReceipts && !isSelected) ? 'rgba(74, 222, 128, 0.15)' : undefined }}
                            >
                                <span className="day-number">{date.getDate()}</span>
                                {hasReceipts && <div className="indicator-dot"></div>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Receipts */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="flex items-center gap-2" style={{ margin: 0 }}>
                        <CalendarIcon size={20} />
                        {selectedDateStr} の履歴
                    </h3>
                    <Link href={`/manual?date=${selectedDateStr}`} className="btn btn-primary" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                        この日に手入力
                    </Link>
                </div>

                {selectedReceipts.length === 0 ? (
                    <div className="card text-center text-muted" style={{ padding: '3rem 1rem' }}>
                        この日のレシート登録はありません
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {selectedReceipts.map((receipt) => (
                            <Link key={receipt.id} href={`/receipts/${receipt.id}`} className="card card-link">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-lg font-bold">¥{receipt.totalAmount.toLocaleString()}</span>
                                    <span className="text-sm text-muted">{receipt.date}</span>
                                </div>
                                <div className="text-sm text-muted" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {receipt.items.slice(0, 3).map((item) => (
                                        <span key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                            {item.category && item.category !== "未分類" && (
                                                <span style={{ fontSize: '0.7em', padding: '0.1rem 0.3rem', background: 'var(--primary)', color: 'white', borderRadius: '2px' }}>{item.category}</span>
                                            )}
                                            <span>{item.name}</span>
                                        </span>
                                    ))}
                                    {receipt.items.length > 3 && (
                                        <span style={{ padding: '0.2rem' }}>他 {receipt.items.length - 3} 件...</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
