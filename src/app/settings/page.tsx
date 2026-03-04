"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Edit2, Columns, Calendar, Settings as SettingsIcon, X } from "lucide-react";
import CalculatorPad from "@/components/CalculatorPad";

type SubCategory = { id: string; name: string; categoryId: string };
type Category = { id: string; name: string; subCategories: SubCategory[] };
type RecurringEntry = { id: string; name: string; amount: number; category: string; subCategory: string | null };

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"categories" | "recurring" | "income">("categories");

    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});

    // Recurring state
    const [recurringEntries, setRecurringEntries] = useState<RecurringEntry[]>([]);
    const [newRecurring, setNewRecurring] = useState({ name: "", amount: 0, category: "", subCategory: "" });

    // Income state
    const [income, setIncome] = useState<number | null>(null);
    const [isEditingIncome, setIsEditingIncome] = useState(false);
    const [editIncomeValue, setEditIncomeValue] = useState("");
    const [isSavingIncome, setIsSavingIncome] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    // Calculator State
    const [calcTarget, setCalcTarget] = useState<{ type: 'income' | 'recurring' } | null>(null);

    useEffect(() => {
        fetchCategories();
        fetchRecurring();
    }, []);

    useEffect(() => {
        fetchIncome(selectedMonth);
    }, [selectedMonth]);

    const fetchIncome = async (monthPrefix: string) => {
        try {
            const res = await fetch(`/api/income?month=${monthPrefix}`);
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

    const handleSaveIncome = async () => {
        if (editIncomeValue.trim() === "") {
            handleDeleteIncome();
            return;
        }

        const amount = Number(editIncomeValue);
        if (isNaN(amount) || amount < 0) return;

        setIsSavingIncome(true);
        try {
            const res = await fetch("/api/income", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: selectedMonth, amount })
            });

            if (res.ok) {
                const data = await res.json();
                setIncome(data.income.amount);
                setIsEditingIncome(false);
                router.refresh(); // Refresh to update dashboard
            }
        } catch (err) {
            console.error("Failed to save income:", err);
        } finally {
            setIsSavingIncome(false);
        }
    };

    const handleDeleteIncome = async () => {
        if (income === null) {
            setIsEditingIncome(false);
            return;
        }
        setIsSavingIncome(true);
        try {
            const res = await fetch(`/api/income?month=${selectedMonth}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setIncome(null);
                setEditIncomeValue("");
                setIsEditingIncome(false);
                router.refresh();
            }
        } catch (err) {
            console.error("Failed to delete income:", err);
        } finally {
            setIsSavingIncome(false);
        }
    };

    const fetchCategories = async () => {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (res.ok) {
            setCategories(await res.json());
            router.refresh();
        }
    };

    const fetchRecurring = async () => {
        const res = await fetch("/api/recurring", { cache: "no-store" });
        if (res.ok) setRecurringEntries(await res.json());
    };

    // --- Category Actions ---
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newCategoryName.trim() })
        });
        if (res.ok) {
            setNewCategoryName("");
            fetchCategories();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`「${name}」を削除しますか？\n※適用されているレシートのカテゴリ名自体は手動で変更しない限り残りますが、今後の選択肢からは消えます。`)) return;
        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchCategories();
            } else {
                const data = await res.json();
                alert(`削除失敗: ${data.error || '不明なエラー'}`);
            }
        } catch (err) {
            console.error(err);
            alert("通信エラーが発生しました");
        }
    };

    const handleAddSubCategory = async (categoryId: string) => {
        const name = newSubCategoryNames[categoryId]?.trim();
        if (!name) return;
        const res = await fetch("/api/subcategories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, categoryId })
        });
        if (res.ok) {
            setNewSubCategoryNames(prev => ({ ...prev, [categoryId]: "" }));
            fetchCategories();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    };

    const handleDeleteSubCategory = async (id: string, name: string) => {
        if (!confirm(`小分類「${name}」を削除しますか？`)) return;
        try {
            const res = await fetch(`/api/subcategories/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchCategories();
            } else {
                const data = await res.json();
                alert(`削除失敗: ${data.error || '不明なエラー'}`);
            }
        } catch (err) {
            console.error(err);
            alert("通信エラーが発生しました");
        }
    };

    // --- Recurring Actions ---
    const handleAddRecurring = async () => {
        if (!newRecurring.name.trim() || !newRecurring.amount || !newRecurring.category) {
            alert("品名・金額・カテゴリは必須です。");
            return;
        }
        const res = await fetch("/api/recurring", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newRecurring.name.trim(),
                amount: newRecurring.amount,
                category: newRecurring.category,
                subCategory: newRecurring.subCategory || null
            })
        });
        if (res.ok) {
            setNewRecurring({ name: "", amount: 0, category: "", subCategory: "" });
            fetchRecurring();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    };

    const handleDeleteRecurring = async (id: string, name: string) => {
        if (!confirm(`自動入力「${name}」を削除しますか？`)) return;
        const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
        if (res.ok) fetchRecurring();
    };


    // Helper to get subcategories for a given category name (for recurring entry form)
    const getSubCats = (catName: string) => {
        const cat = categories.find(c => c.name === catName);
        return cat ? cat.subCategories : [];
    };

    return (
        <div className="slide-up pb-20">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => router.push("/")} className="btn" style={{ padding: '0.5rem', width: 'auto', background: 'transparent', color: 'var(--primary)' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ marginBottom: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <SettingsIcon size={24} color="var(--primary)" /> 設定
                </h1>
            </div>

            <div className="flex gap-2 mb-6" style={{ background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '12px' }}>
                <button
                    className={`btn ${activeTab === "categories" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1, border: activeTab === "categories" ? 'none' : '1px solid transparent' }}
                    onClick={() => setActiveTab("categories")}
                >
                    <Columns size={18} /> カテゴリ
                </button>
                <button
                    className={`btn ${activeTab === "recurring" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1, border: activeTab === "recurring" ? 'none' : '1px solid transparent' }}
                    onClick={() => setActiveTab("recurring")}
                >
                    <Calendar size={18} /> 固定費
                </button>
                <button
                    className={`btn ${activeTab === "income" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1, border: activeTab === "income" ? 'none' : '1px solid transparent' }}
                    onClick={() => setActiveTab("income")}
                >
                    💰 収入
                </button>
            </div>

            {activeTab === "income" && (
                <div className="flex flex-col gap-6 slide-up">
                    <div className="card">
                        <h2 className="text-lg mb-4">月間収入の設定</h2>
                        <div className="flex items-center gap-4 mb-6">
                            <input
                                type="month"
                                className="form-input"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                style={{ width: 'auto' }}
                            />
                            <span className="text-muted text-sm">※設定したい月を選択してください</span>
                        </div>

                        <div style={{ background: 'var(--secondary)', padding: '1rem', borderRadius: '8px' }}>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{selectedMonth.replace('-', '年')}月の収入</h3>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                        {income !== null && !isEditingIncome ? `¥${income.toLocaleString()}` : (isEditingIncome ? "" : "未設定")}
                                    </div>
                                </div>
                                {income !== null && !isEditingIncome && (
                                    <button
                                        className="btn btn-outline flex items-center gap-2"
                                        onClick={() => { setIsEditingIncome(true); setEditIncomeValue(income.toString()); }}
                                    >
                                        <Edit2 size={16} /> 編集
                                    </button>
                                )}
                            </div>

                            {(income === null || isEditingIncome) && (
                                <div className="flex gap-2">
                                    <div
                                        className="form-input flex items-center bg-background"
                                        style={{ flex: 1, minHeight: '42px', cursor: 'pointer' }}
                                        onClick={() => setCalcTarget({ type: 'income' })}
                                    >
                                        {editIncomeValue === "" ? "収入額を入力 (円)" : `¥${Number(editIncomeValue).toLocaleString()}`}
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSaveIncome}
                                        disabled={isSavingIncome}
                                        style={{ width: 'auto' }}
                                    >
                                        <Save size={18} /> {isSavingIncome ? "保存中..." : "保存"}
                                    </button>
                                    {isEditingIncome && (
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setIsEditingIncome(false)}
                                            style={{ width: 'auto', background: 'rgba(255, 0, 0, 0.1)', borderColor: 'rgba(255, 0, 0, 0.2)', color: 'var(--destructive)' }}
                                        >
                                            キャンセル
                                        </button>
                                    )}
                                    {isEditingIncome && income !== null && (
                                        <button
                                            className="btn btn-outline"
                                            onClick={handleDeleteIncome}
                                            disabled={isSavingIncome}
                                            style={{ width: 'auto', border: 'none', color: 'var(--destructive)', padding: '0.4rem' }}
                                            title="削除"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "categories" && (
                <div className="flex flex-col gap-6 slide-up">
                    <div className="card">
                        <h2 className="text-lg mb-4">新しい大分類を追加</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="例：サブスク"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleAddCategory}>
                                <Plus size={20} /> 追加
                            </button>
                        </div>
                    </div>

                    <h2 className="text-lg mt-4 mb-2">カテゴリ一覧・小分類の編集</h2>
                    <div className="flex flex-col gap-4">
                        {categories.map(category => (
                            <div key={category.id} className="card p-0 overflow-hidden">
                                <div className="flex justify-between items-center p-4" style={{ background: 'var(--secondary)' }}>
                                    <h3 className="font-bold text-lg m-0">{category.name}</h3>
                                    <button onClick={() => handleDeleteCategory(category.id, category.name)} className="btn btn-outline" style={{ width: 'auto', padding: '0.4rem', border: 'none', color: 'var(--destructive)' }} title="大分類ごと削除">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    {category.subCategories.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {category.subCategories.map(sub => (
                                                <div key={sub.id} className="flex items-center gap-1" style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                                                    {sub.name}
                                                    <button onClick={() => handleDeleteSubCategory(sub.id, sub.name)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 0.2rem' }}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted m-0">小分類はありません</p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="小分類を追加"
                                            value={newSubCategoryNames[category.id] || ""}
                                            onChange={(e) => setNewSubCategoryNames({ ...newSubCategoryNames, [category.id]: e.target.value })}
                                            style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                                        />
                                        <button className="btn btn-outline" style={{ width: 'auto', padding: '0.4rem 0.8rem' }} onClick={() => handleAddSubCategory(category.id)}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "recurring" && (
                <div className="flex flex-col gap-6 slide-up">
                    <div className="card">
                        <h2 className="text-lg mb-2">毎月の固定費を追加</h2>
                        <p className="text-sm text-muted mb-4">ここで登録した項目は、毎月最初にダッシュボードを開いた時に自動的に記録されます。（同じ月に何度開いても記録されるのは1回のみです）</p>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="品名（例：家賃、Netflix）"
                                value={newRecurring.name}
                                onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <span className="flex items-center text-muted pl-1">¥</span>
                                <div
                                    className="form-input flex items-center bg-background"
                                    style={{ flex: 1, minHeight: '42px', cursor: 'pointer' }}
                                    onClick={() => setCalcTarget({ type: 'recurring' })}
                                >
                                    {newRecurring.amount === 0 ? "金額" : newRecurring.amount.toLocaleString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="form-input"
                                    value={newRecurring.category}
                                    onChange={(e) => setNewRecurring({ ...newRecurring, category: e.target.value, subCategory: getSubCats(e.target.value).length > 0 ? getSubCats(e.target.value)[0].name : "" })}
                                >
                                    <option value="" disabled>大分類を選択</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                {newRecurring.category && getSubCats(newRecurring.category).length > 0 && (
                                    <select
                                        className="form-input"
                                        style={{ borderTopColor: 'var(--primary)', borderTopWidth: '2px' }}
                                        value={newRecurring.subCategory}
                                        onChange={(e) => setNewRecurring({ ...newRecurring, subCategory: e.target.value })}
                                    >
                                        <option value="" disabled>小分類を選択</option>
                                        {getSubCats(newRecurring.category).map(sub => (
                                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <button className="btn btn-primary mt-2" onClick={handleAddRecurring}>
                                <Plus size={20} /> 固定費を登録
                            </button>
                        </div>
                    </div>

                    <h2 className="text-lg mt-4 mb-2">登録済みの自動入力（固定費）一覧</h2>
                    <div className="flex flex-col gap-3">
                        {recurringEntries.length === 0 ? (
                            <p className="text-muted text-center py-8">登録されている自動入力はありません。</p>
                        ) : (
                            recurringEntries.map(entry => (
                                <div key={entry.id} className="card flex justify-between items-center py-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold">{entry.name}</span>
                                        <div className="flex gap-2 text-xs">
                                            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{entry.category}</span>
                                            {entry.subCategory && <span style={{ border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{entry.subCategory}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-bold">¥{entry.amount.toLocaleString()}</span>
                                        <button onClick={() => handleDeleteRecurring(entry.id, entry.name)} className="btn btn-outline" style={{ width: 'auto', padding: '0.4rem', border: 'none', color: 'var(--destructive)' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Calculator Pad Overlay */}
            {calcTarget !== null && (
                <CalculatorPad
                    initialValue={
                        calcTarget.type === 'income'
                            ? Number(editIncomeValue) || 0
                            : newRecurring.amount
                    }
                    onComplete={(val) => {
                        if (calcTarget.type === 'income') {
                            setEditIncomeValue(val.toString());
                        } else {
                            setNewRecurring({ ...newRecurring, amount: val });
                        }
                        setCalcTarget(null);
                    }}
                    onClose={() => setCalcTarget(null)}
                />
            )}
        </div>
    );
}
