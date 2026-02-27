"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

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
    "#FF6B6B", // Red (Food etc.)
    "#4ECDC4", // Teal (Daily goods etc.)
    "#FF9F43", // Orange (Transportation etc.)
    "#54A0FF", // Light Blue (Utilities etc.)
    "#5F27CD", // Purple (Entertainment etc.)
    "#FF3F34", // Bright Red (Healthcare etc.)
    "#01A3A4", // Dark Teal (Education etc.)
    "#2E86DE", // Dark Blue (Housing etc.)
    "#F368E0", // Pink (Beauty etc.)
    "#8395A7", // Grey (Others)
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
    "その他": "#8395A7"
};

export default function ExpensePieChart({ receipts }: Props) {
    const data = useMemo(() => {
        const categoryMap: Record<string, number> = {};

        receipts.forEach((receipt) => {
            receipt.items.forEach((item) => {
                const category = item.category || "その他";
                categoryMap[category] = (categoryMap[category] || 0) + item.price;
            });
        });

        const dataArray = Object.keys(categoryMap).map((key) => ({
            name: key,
            value: categoryMap[key],
        }));

        // Sort by value descending
        return dataArray.sort((a, b) => b.value - a.value);
    }, [receipts]);

    if (data.length === 0) {
        return (
            <div className="card slide-up" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                この月の支出データはありません
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'white', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].name}</p>
                    <p style={{ margin: 0, color: payload[0].payload.fill }}>
                        ¥{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, outerRadius, percent, name, value, fill } = props;

        // Hide label for small slices to prevent overlap, except if it's the only one
        if (percent < 0.03 && data.length > 5) return null;

        const RADIAN = Math.PI / 180;
        // Increase radius slightly to place text outside
        const radius = outerRadius * 1.25;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill={fill}
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: '12px', fontWeight: 'bold' }}
            >
                {`${name} ${(percent * 100).toFixed(0)}%`}
                <tspan
                    x={x}
                    dy="1.2em"
                    fill="var(--foreground)"
                    style={{ fontSize: '11px', opacity: 0.7 }}
                >
                    ¥{value.toLocaleString()}
                </tspan>
            </text>
        );
    };

    return (
        <div className="card slide-up" style={{ padding: '1.5rem', height: '400px' }}>
            <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center', fontSize: '1.1rem' }}>カテゴリ別支出割合</h3>
            <div style={{ width: '100%', height: 'calc(100% - 2rem)' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            label={renderCustomizedLabel}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry: any) => (
                                <span style={{ color: 'var(--foreground)' }}>{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
