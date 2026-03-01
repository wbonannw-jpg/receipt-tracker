"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, Calculator } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import CalculatorPad from "@/components/CalculatorPad";

type Item = {
    name: string;
    price: number;
    category: string;
    subCategory?: string | null;
};

function ManualEntryForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get date from URL or default to today
    const dateParam = searchParams.get("date");
    const defaultDate = dateParam || new Date().toISOString().split('T')[0];

    const { CATEGORIES, getSubCategories, loading: catsLoading } = useCategories();

    const [date, setDate] = useState(defaultDate);
    const [items, setItems] = useState<Item[]>([
        { name: "", price: 0, category: "未分類", subCategory: null }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    // Calculator state
    const [activeCalcIndex, setActiveCalcIndex] = useState<number | null>(null);

    // Calculate total amount automatically
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
        const newItems = [...items];
        if (field === "price") {
            newItems[index][field] = Number(value) || 0;
        } else if (field === "category") {
            newItems[index][field] = value as string;
            // Also update subcategory if the new category has any
            const subs = getSubCategories(value as string);
            newItems[index].subCategory = subs.length > 0 ? subs[0] : null;
        } else {
            newItems[index][field] = value as string;
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { name: "", price: 0, category: "未分類", subCategory: null }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSave = async () => {
        // Validation
        if (!date) {
            alert("日付を入力してください。");
            return;
        }
        setIsSaving(true);
        try {
            // Replace empty names with "未入力"
            const finalItems = items.map(item => ({
                ...item,
                name: item.name.trim() === "" ? "未入力" : item.name.trim()
            }));

            const res = await fetch("/api/receipts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date,
                    totalAmount,
                    items: finalItems,
                }),
            });

            if (res.ok) {
                window.location.href = `/?date=${date}`;
            } else {
                alert("保存に失敗しました。");
            }
        } catch (error) {
            console.error(error);
            alert("保存に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="slide-up">
            <div className="flex justify-between items-center mb-6">
                <Link href={`/?date=${date}`} className="btn" style={{ padding: '0.5rem', width: 'auto', background: 'transparent', color: 'var(--primary)' }}>
                    <ArrowLeft size={24} />
                    <span className="sr-only">戻る</span>
                </Link>
                <h1 style={{ marginBottom: 0, fontSize: '1.5rem' }}>手入力で追加</h1>
                <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
            </div>

            <div className="card mb-6">
                <div className="form-group">
                    <label className="form-label">日付</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group mb-0">
                    <label className="form-label flex items-center gap-2">
                        <Calculator size={16} /> 合計金額 (自動計算)
                    </label>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        ¥{totalAmount.toLocaleString()}
                    </div>
                </div>
            </div>

            <h2 className="mb-4">購入品目</h2>

            {catsLoading ? (
                <div className="py-8 text-center text-muted">カテゴリを読み込み中...</div>
            ) : (
                <div className="flex flex-col gap-4 mb-6">
                    {items.map((item, index) => (
                        <div key={index} className="card" style={{ padding: '1rem' }}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm text-muted">品目 {index + 1}</span>
                                {items.length > 1 && (
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="text-destructive p-1"
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="品名 (例: 牛乳)"
                                value={item.name}
                                onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                className="form-input mb-2"
                            />
                            <div className="flex gap-2">
                                <select
                                    className="form-input"
                                    style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                                    value={item.category}
                                    onChange={(e) => handleItemChange(index, "category", e.target.value)}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                {getSubCategories(item.category).length > 0 && (
                                    <select
                                        className="form-input"
                                        style={{ flex: 1, padding: '0.4rem 0.6rem', borderTopColor: 'var(--primary)', borderTopWidth: '2px' }}
                                        value={item.subCategory || ""}
                                        onChange={(e) => handleItemChange(index, "subCategory", e.target.value)}
                                    >
                                        {getSubCategories(item.category).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                )}

                                <div className="flex items-center gap-2" style={{ flex: 1 }}>
                                    <span className="text-muted">¥</span>
                                    <div
                                        onClick={() => setActiveCalcIndex(index)}
                                        className="form-input flex items-center bg-background"
                                        style={{ padding: '0.4rem 0.6rem', minHeight: '38px', cursor: 'pointer', flex: 1 }}
                                    >
                                        {item.price || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Calculator Pad Overlay */}
            {activeCalcIndex !== null && (
                <CalculatorPad
                    initialValue={items[activeCalcIndex].price}
                    onComplete={(val) => {
                        handleItemChange(activeCalcIndex, "price", val);
                        setActiveCalcIndex(null);
                    }}
                    onClose={() => setActiveCalcIndex(null)}
                />
            )}

            <button
                onClick={addItem}
                className="btn btn-outline mb-6"
                style={{ borderStyle: 'dashed' }}
            >
                <Plus size={20} /> 品目を追加
            </button>

            <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary"
                style={{ padding: '1rem', fontSize: '1.1rem' }}
            >
                <Save size={20} />
                {isSaving ? "保存中..." : "保存する"}
            </button>
        </div>
    );
}

export default function ManualEntryPage() {
    return (
        <Suspense fallback={<div className="text-center p-8"><div className="spinner mt-4 mx-auto"></div></div>}>
            <ManualEntryForm />
        </Suspense>
    );
}
