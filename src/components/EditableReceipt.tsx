"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Edit2, X, Calculator } from "lucide-react";
import Link from "next/link";

import { useCategories } from "@/hooks/useCategories";

type Item = {
    id?: string;
    name: string;
    price: number;
    category?: string;
    subCategory?: string | null;
};

type Receipt = {
    id: string;
    date: string;
    totalAmount: number;
    items: Item[];
};

export default function EditableReceipt({ initialReceipt }: { initialReceipt: Receipt }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const { CATEGORIES, getSubCategories, loading: catsLoading } = useCategories();

    // Edit State
    const [date, setDate] = useState(initialReceipt.date);
    const [items, setItems] = useState<Item[]>(initialReceipt.items.map(item => ({ ...item })));

    // Auto calculate total
    const currentTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
        const newItems = [...items];
        if (field === "category") {
            const subs = getSubCategories(value as string);
            newItems[index] = { ...newItems[index], [field]: value as string, subCategory: subs.length > 0 ? subs[0] : null };
        } else {
            newItems[index] = { ...newItems[index], [field]: value as any };
        }
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { name: "", price: 0, category: "未分類", subCategory: null }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleCancel = () => {
        // Reset state
        setDate(initialReceipt.date);
        setItems(initialReceipt.items.map(item => ({ ...item })));
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!date) {
            alert("日付を入力してください。");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/receipts/${initialReceipt.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date,
                    totalAmount: currentTotal,
                    items
                })
            });

            if (!res.ok) throw new Error("更新に失敗しました");

            // On success, force refresh to fetch new data, then turn off edit mode
            router.refresh();
            setIsEditing(false);

        } catch (error) {
            console.error(error);
            alert("保存中にエラーが発生しました。");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/receipts/${initialReceipt.id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("削除に失敗しました");

            window.location.href = "/";
        } catch (error) {
            console.error(error);
            alert("削除中にエラーが発生しました。");
            setDeleting(false);
            setShowConfirmDelete(false);
        }
    };

    return (
        <div className="slide-up">
            <div className="flex items-center justify-between mb-6">
                <Link href="/" className="btn btn-outline" style={{ width: 'auto' }}>
                    <ArrowLeft size={20} />
                    ホームに戻る
                </Link>
                {!isEditing && (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ width: 'auto' }}>
                            <Edit2 size={20} />
                            編集する
                        </button>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    {isEditing ? (
                        <div style={{ flex: 1 }}>
                            <label className="text-sm text-muted mb-1 block">日付</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                            />
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-muted mb-1">購入日</p>
                            <h2 style={{ margin: 0 }}>{date}</h2>
                        </div>
                    )}

                    <div style={{ textAlign: 'right' }}>
                        <p className="text-sm text-muted mb-1">合計金額</p>
                        <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '2rem' }}>
                            ¥{currentTotal.toLocaleString()}
                        </h2>
                        {!isEditing && currentTotal !== initialReceipt.totalAmount && (
                            <p className="text-sm" style={{ color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>
                                支払合計: ¥{initialReceipt.totalAmount.toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    // ---------------- EDIT MODE ----------------
                    catsLoading ? (
                        <div className="py-8 text-center text-muted">カテゴリを読み込み中...</div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {items.map((item, index) => (
                                <div key={index} style={{ background: 'var(--secondary)', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {/* Row 1: 品名 + 削除ボタン */}
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={item.name}
                                            placeholder="品名"
                                            onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                        <button
                                            onClick={() => handleRemoveItem(index)}
                                            className="btn btn-outline"
                                            style={{ padding: '0.6rem', width: 'auto', border: '1px solid var(--destructive)', color: 'var(--destructive)', flexShrink: 0 }}
                                            title="削除"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    {/* Row 2: 大分類 + 小分類 */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select
                                            value={item.category || "未分類"}
                                            onChange={(e) => handleItemChange(index, "category", e.target.value)}
                                            style={{ flex: 1, minWidth: 0, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }}
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        {(item.category && getSubCategories(item.category).length > 0) && (
                                            <select
                                                value={item.subCategory || ""}
                                                onChange={(e) => handleItemChange(index, "subCategory", e.target.value)}
                                                style={{ flex: 1, minWidth: 0, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--primary)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }}
                                            >
                                                {getSubCategories(item.category).map(sub => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    {/* Row 3: 金額 */}
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>¥</span>
                                        <input
                                            type="number"
                                            value={item.price === 0 ? '' : item.price}
                                            onChange={(e) => handleItemChange(index, "price", parseInt(e.target.value) || 0)}
                                            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                        />
                                    </div>
                                </div>

                            ))}

                            <button
                                onClick={handleAddItem}
                                className="btn btn-outline mt-2"
                                style={{ borderStyle: 'dashed' }}
                            >
                                <Plus size={20} />
                                品目を追加
                            </button>

                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={handleCancel}
                                    className="btn btn-outline"
                                    disabled={saving}
                                >
                                    <X size={20} />
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    <Save size={20} />
                                    {saving ? "保存中..." : "変更を保存"}
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    // ---------------- VIEW MODE (Read Only) ----------------
                    <div className="flex flex-col gap-3">
                        {items.map((item, index) => (
                            <div key={item.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: index < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    {item.category && item.category !== "未分類" && (
                                        <div className="flex gap-1" style={{ alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--primary)', color: 'white', borderRadius: '4px' }}>
                                                {item.category}
                                            </span>
                                            {item.subCategory && (
                                                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '4px' }}>
                                                    {item.subCategory}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <span className="font-medium">{item.name || "未入力"}</span>
                                </div>
                                <span className="text-lg">¥{item.price.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete button pushed to bottom, only show in view mode */}
            {!isEditing && (
                <div className="mt-10 flex flex-col items-center gap-2">
                    {showConfirmDelete ? (
                        <div className="flex flex-col items-center gap-3 p-4 border rounded-lg" style={{ borderColor: 'var(--destructive)', background: 'rgba(239, 68, 68, 0.05)' }}>
                            <p className="font-bold m-0 text-sm" style={{ color: 'var(--destructive)' }}>本当にこのレシートを削除しますか？</p>
                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => setShowConfirmDelete(false)}
                                    className="btn btn-outline"
                                    disabled={deleting}
                                    style={{ width: 'auto', padding: '0.4rem 1rem' }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn btn-primary"
                                    style={{ width: 'auto', padding: '0.4rem 1rem', background: 'var(--destructive)', border: 'none' }}
                                    disabled={deleting}
                                >
                                    <Trash2 size={16} />
                                    {deleting ? "削除中..." : "はい、削除します"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirmDelete(true)}
                            className="btn btn-outline"
                            style={{ border: 'none', color: 'var(--destructive)', opacity: 0.8 }}
                        >
                            <Trash2 size={16} className="mr-2" />
                            このレシートを削除する
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
