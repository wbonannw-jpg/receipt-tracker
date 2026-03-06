"use client";

import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Cell,
    LabelList,
} from "recharts";

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

type Props = {
    receipts: Receipt[];
};

const COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#FF9F43",
    "#54A0FF",
    "#5F27CD",
    "#FF3F34",
    "#01A3A4",
    "#2E86DE",
    "#F368E0",
    "#8395A7",
];

const CATEGORY_COLORS: Record<string, string> = {
    "食費": "#FF6B6B",
    "日用品": "#4ECDC4",
    "交通費": "#FF9F43",
    "趣味・娯楽": "#5F27CD",
    "交際費": "#FF9F43",
    "衣類": "#F368E0",
    "美容・ヘア": "#F368E0",
    "医療費": "#01A3A4",
    "光熱費": "#54A0FF",
    "通信費": "#8395a7",
    "その他": "#8395A7",
};

export default function ExpenseStackedBar({ receipts }: Props) {
    const data = useMemo(() => {
        const categoryMap: Record<string, number> = {};
        receipts.forEach((receipt) => {
            receipt.items.forEach((item) => {
                const category = item.category || "その他";
                categoryMap[category] = (categoryMap[category] || 0) + item.price;
            });
        });
        return Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [receipts]);

    if (data.length === 0) {
        return (
            <div className="card slide-up" style={{ padding: "2rem", textAlign: "center" }}>
                この月の支出データはありません
            </div>
        );
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);

    // recharts の積み上げ横棒グラフは、各カテゴリをキーとした1行のデータが必要
    const chartRow: Record<string, number> = {};
    data.forEach((d) => { chartRow[d.name] = d.value; });

    return (
        <div className="card slide-up" style={{ padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", textAlign: "center", fontSize: "1.1rem" }}>
                カテゴリ別支出割合
            </h3>

            {/* 積み上げ横棒グラフ */}
            <div style={{ width: "100%", height: 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={[chartRow]}
                        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        barSize={36}
                    >
                        <XAxis type="number" hide />
                        <YAxis type="category" hide />
                        {data.map((entry, index) => (
                            <Bar
                                key={entry.name}
                                dataKey={entry.name}
                                stackId="a"
                                fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]}
                                radius={
                                    index === 0
                                        ? [4, 0, 0, 4]
                                        : index === data.length - 1
                                            ? [0, 4, 4, 0]
                                            : [0, 0, 0, 0]
                                }
                            >
                                {/* 幅が十分あるスライスのみ%ラベルを表示 */}
                                <LabelList
                                    dataKey={entry.name}
                                    position="center"
                                    formatter={(v: any) =>
                                        Number(v) / total >= 0.08
                                            ? `${((Number(v) / total) * 100).toFixed(0)}%`
                                            : ""
                                    }
                                    style={{ fill: "#fff", fontSize: "11px", fontWeight: 600 }}
                                />
                            </Bar>
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* カテゴリ凡例 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "1rem" }}>
                {data.map((entry, index) => {
                    const color = CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length];
                    return (
                        <div key={entry.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                                <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>{entry.name}</span>
                            </div>
                            <span style={{ fontSize: "0.8rem", color, fontWeight: 600 }}>
                                ¥{entry.value.toLocaleString()}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
