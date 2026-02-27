"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Calculator as CalculatorIcon } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import CalculatorPad from "@/components/CalculatorPad";

type Item = {
    name: string;
    price: number;
    category?: string;
    subCategory?: string | null;
};

type ReceiptData = {
    date: string;
    totalAmount: number;
    items: Item[];
    imageUrl?: string;
};

export default function ResultPage() {
    const router = useRouter();
    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { CATEGORIES, getSubCategories, loading: catsLoading } = useCategories();

    // Calculator State
    const [calcTarget, setCalcTarget] = useState<{ type: 'total' | 'item'; index?: number } | null>(null);

    useEffect(() => {
        const rawData = sessionStorage.getItem("receiptResult");
        if (rawData) {
            try {
                setData(JSON.parse(rawData));
            } catch (e) {
                console.error("Failed to parse data");
            }
        }
        setLoading(false);
    }, []);

    if (loading || catsLoading) return <div className="p-8 text-center text-muted">読み込み中...</div>;

    if (!data) {
        return (
            <div className="card text-center slide-up" style={{ padding: "3rem 1rem" }}>
                <p className="text-muted mb-4">解析データが見つかりません。もう一度お試しください。</p>
                <button className="btn btn-primary outline" onClick={() => router.push("/camera")}>
                    カメラに戻る
                </button>
            </div>
        );
    }

    const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
        const newItems = [...data.items];
        if (field === "category") {
            const subs = getSubCategories(value as string);
            newItems[index] = { ...newItems[index], category: value as string, subCategory: subs.length > 0 ? subs[0] : null };
        } else {
            newItems[index] = { ...newItems[index], [field]: value as any };
        }
        setData({ ...data, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData({ ...data, items: newItems });
    };

    const addItem = () => {
        setData({
            ...data,
            items: [...data.items, { name: "", price: 0, category: "未分類", subCategory: null }]
        });
    };

    const calculateTotal = () => {
        const sum = data.items.reduce((acc, item) => acc + Number(item.price || 0), 0);
        setData({ ...data, totalAmount: sum });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/receipts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    date: data.date,
                    totalAmount: data.totalAmount,
                    items: data.items.map(item => ({
                        ...item,
                        name: item.name.trim() === "" ? "未入力" : item.name.trim()
                    }))
                })
            });

            if (!res.ok) throw new Error("保存に失敗しました");

            sessionStorage.removeItem("receiptResult");
            window.location.href = `/?date=${data.date}`;

        } catch (error) {
            alert("保存中にエラーが発生しました。");
            setSaving(false);
        }
    };

    return (
        <div className="slide-up">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="btn" style={{ padding: '0.5rem', width: 'auto', background: 'transparent' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ marginBottom: 0, fontSize: '1.5rem' }}>結果の確認</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ width: 'auto' }}
                >
                    {saving ? "保存中..." : <><Save size={18} /><span>保存する</span></>}
                </button>
            </div>

            <div className="card mb-6">
                <h2 className="text-lg">基本情報</h2>
                <div className="form-group mb-4 mt-4">
                    <label className="form-label">日付</label>
                    <input
                        type="date"
                        className="form-input"
                        value={data.date || ""}
                        onChange={(e) => setData({ ...data, date: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label flex items-center justify-between">
                        <span>合計金額</span>
                    </label>
                    <div className="flex gap-2">
                        <div
                            className="form-input flex items-center bg-background"
                            style={{ cursor: 'pointer', flex: 1 }}
                            onClick={() => setCalcTarget({ type: 'total' })}
                        >
                            ¥{data.totalAmount}
                        </div>
                        <button className="btn btn-outline flex items-center gap-1" style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0.5rem 0.5rem' }} onClick={calculateTotal}>
                            <CalculatorIcon size={16} /> 再計算
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg m-0" style={{ marginBottom: 0 }}>購入品目</h2>
                    <button onClick={addItem} className="btn btn-outline flex items-center gap-1 text-sm" style={{ width: 'auto', padding: '0.25rem 0.5rem' }}>
                        <Plus size={16} /> 追加
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {data.items.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start p-3" style={{ background: "var(--secondary)", borderRadius: "var(--radius)" }}>
                            <div className="flex-1 flex flex-col gap-2">
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ padding: '0.4rem 0.6rem' }}
                                    placeholder="商品名"
                                    value={item.name}
                                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <div
                                        className="form-input flex items-center bg-background"
                                        style={{ padding: '0.4rem 0.6rem', flex: 1, cursor: 'pointer' }}
                                        onClick={() => setCalcTarget({ type: 'item', index })}
                                    >
                                        ¥{item.price}
                                    </div>
                                    <select
                                        className="form-input"
                                        style={{ padding: '0.4rem 0.6rem', flex: 1 }}
                                        value={item.category || "未分類"}
                                        onChange={(e) => handleItemChange(index, "category", e.target.value)}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>

                                    {(item.category && getSubCategories(item.category).length > 0) && (
                                        <select
                                            className="form-input"
                                            style={{ padding: '0.4rem 0.6rem', flex: 1, borderTopColor: 'var(--primary)', borderTopWidth: '2px' }}
                                            value={item.subCategory || ""}
                                            onChange={(e) => handleItemChange(index, "subCategory", e.target.value)}
                                        >
                                            {getSubCategories(item.category).map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => removeItem(index)}
                                className="btn btn-destructive"
                                style={{ width: 'auto', padding: '0.5rem', marginTop: "0.2rem" }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {data.items.length === 0 && (
                        <p className="text-muted text-sm text-center py-4">品目がありません</p>
                    )}
                </div>
            </div>

            {/* Calculator Pad Overlay */}
            {calcTarget !== null && (
                <CalculatorPad
                    initialValue={
                        calcTarget.type === 'total'
                            ? data.totalAmount
                            : data.items[calcTarget.index!].price
                    }
                    onComplete={(val) => {
                        if (calcTarget.type === 'total') {
                            setData({ ...data, totalAmount: val });
                        } else {
                            handleItemChange(calcTarget.index!, "price", val);
                        }
                        setCalcTarget(null);
                    }}
                    onClose={() => setCalcTarget(null)}
                />
            )}

            {data.imageUrl && (
                <div className="card mt-6">
                    <h2 className="text-lg mb-4">アップロードした画像</h2>
                    <img src={data.imageUrl} alt="Receipt" style={{ width: '100%', borderRadius: 'var(--radius)' }} />
                </div>
            )}
        </div>
    );
}
