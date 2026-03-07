"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, ExternalLink, ShoppingBag, Store, Search, Plus, Trash2 } from "lucide-react";
import { getOnlineSales, checkPhysicalStoreSale, SalePlatformStatus, PhysicalStoreSaleStatus } from "@/lib/salesRules";

type CustomSaleRule = {
    id: string;
    storeName: string;
    saleDay: number;
    description: string;
};

export default function SalesPage() {
    const [onlineSales, setOnlineSales] = useState<SalePlatformStatus[]>([]);

    // GPS & Places Search State
    const [radius, setRadius] = useState<number>(30000); // default 30km
    const [isSearching, setIsSearching] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [nearbySales, setNearbySales] = useState<PhysicalStoreSaleStatus[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Custom Rules State
    const [customRules, setCustomRules] = useState<CustomSaleRule[]>([]);
    const [todayCustomSales, setTodayCustomSales] = useState<CustomSaleRule[]>([]);
    const [isAddingRule, setIsAddingRule] = useState(false);
    const [newStoreName, setNewStoreName] = useState("");
    const [newSaleDay, setNewSaleDay] = useState(1);
    const [newDescription, setNewDescription] = useState("");
    const [isSubmittingRule, setIsSubmittingRule] = useState(false);
    const [ruleError, setRuleError] = useState<string | null>(null);

    useEffect(() => {
        const today = new Date();
        const todayDate = today.getDate();
        setOnlineSales(getOnlineSales(today));

        // Fetch custom rules
        const fetchCustomRules = async () => {
            try {
                const res = await fetch('/api/custom-sales');
                if (res.ok) {
                    const data = await res.json();
                    setCustomRules(data.rules || []);
                    // Filter rules that apply today
                    const todayRules = (data.rules || []).filter((rule: CustomSaleRule) => rule.saleDay === todayDate);
                    setTodayCustomSales(todayRules);
                }
            } catch (error) {
                console.error("Failed to fetch custom rules:", error);
            }
        };

        fetchCustomRules();
    }, []);

    // Helper to calculate rough distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(1)); // 1 decimal place
    };

    const handleSearchNearby = () => {
        setIsSearching(true);
        setLocationError(null);
        setNearbySales([]);
        setHasSearched(false);

        if (!navigator.geolocation) {
            setLocationError("お使いのブラウザは位置情報に対応していません。");
            setIsSearching(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    // Fetch nearby places from our API
                    const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=${radius}`);
                    if (!res.ok) {
                        throw new Error("Failed to fetch nearby stores.");
                    }

                    const data = await res.json();

                    if (data.results && data.results.length > 0) {
                        const matchingSales: PhysicalStoreSaleStatus[] = [];

                        data.results.forEach((place: any) => {
                            const saleStatus = checkPhysicalStoreSale(place.name, new Date());

                            // If we have a rule for this store length AND it is on sale today
                            if (saleStatus && saleStatus.isSaleToday) {
                                // calculate distance if we have lat/lng
                                let dist = undefined;
                                if (place.location && place.location.lat && place.location.lng) {
                                    dist = calculateDistance(lat, lng, place.location.lat, place.location.lng);
                                }

                                matchingSales.push({
                                    ...saleStatus,
                                    address: place.address,
                                    distance: dist
                                });
                            }
                        });

                        // Sort by distance
                        matchingSales.sort((a, b) => (a.distance || 99) - (b.distance || 99));
                        setNearbySales(matchingSales);
                    }

                    setHasSearched(true);
                } catch (err: any) {
                    setLocationError(err.message || "店舗の検索中にエラーが発生しました。");
                } finally {
                    setIsSearching(false);
                }
            },
            (error) => {
                setIsSearching(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError("位置情報の取得が許可されていません。ブラウザの設定をご確認ください。");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError("位置情報が取得できませんでした。");
                        break;
                    case error.TIMEOUT:
                        setLocationError("位置情報の取得がタイムアウトしました。");
                        break;
                    default:
                        setLocationError("位置情報の取得中に未知のエラーが発生しました。");
                        break;
                }
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
    };

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setRuleError(null);
        setIsSubmittingRule(true);

        try {
            const res = await fetch('/api/custom-sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeName: newStoreName,
                    saleDay: newSaleDay,
                    description: newDescription
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "ルールの登録に失敗しました");
            }

            const newRule = await res.json();

            // Update state
            setCustomRules([...customRules, newRule]);

            // If it applies today, add to today's list
            if (newRule.saleDay === new Date().getDate()) {
                setTodayCustomSales([...todayCustomSales, newRule]);
            }

            // Reset form
            setNewStoreName("");
            setNewSaleDay(1);
            setNewDescription("");
            setIsAddingRule(false);

        } catch (error: any) {
            setRuleError(error.message);
        } finally {
            setIsSubmittingRule(false);
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm("このセールルールを削除しますか？")) return;

        try {
            const res = await fetch(`/api/custom-sales/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("削除に失敗しました");

            setCustomRules(customRules.filter(r => r.id !== id));
            setTodayCustomSales(todayCustomSales.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            alert("削除に失敗しました");
        }
    };

    return (
        <div className="slide-up">
            <div className="flex items-center justify-between mb-6">
                <Link href="/" className="btn btn-outline flex items-center gap-2" style={{ width: 'auto', padding: '0.5rem 0.75rem', border: 'none' }}>
                    <ArrowLeft size={24} />
                    <span className="font-bold">ホーム</span>
                </Link>
                <h1 style={{ margin: 0, fontSize: '1.25rem' }}>今日のセール情報</h1>
            </div>

            {/* My Custom Sales (Today) */}
            {todayCustomSales.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg mb-3 flex items-center gap-2" style={{ color: 'var(--success)' }}>
                        <Store size={20} />
                        マイ登録セールの開催日！
                    </h2>
                    <div className="flex flex-col gap-3">
                        {todayCustomSales.map((sale) => (
                            <div key={sale.id} className="card" style={{ padding: '1rem', borderTop: '4px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{sale.storeName}</h3>
                                    <span style={{ background: 'var(--success)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                                        本日セール中！
                                    </span>
                                </div>
                                <p className="text-sm m-0 font-bold" style={{ color: 'var(--success)' }}>
                                    {sale.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Online Sales Section */}
            <h2 className="text-lg mb-3 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <ShoppingBag size={20} />
                ネット通販の特売日
            </h2>
            <div className="flex flex-col gap-3 mb-8">
                {onlineSales.map((sale) => (
                    <a
                        key={sale.name}
                        href={sale.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card card-link"
                        style={{ padding: '1rem', borderTop: sale.isSaleToday ? '4px solid var(--primary)' : '1px solid var(--border)' }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{sale.name}</h3>
                            {sale.isSaleToday && (
                                <span style={{ background: 'var(--destructive)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                                    本日セール開催中！
                                </span>
                            )}
                        </div>
                        <p className={`text-sm m-0 ${sale.isSaleToday ? 'font-bold' : 'text-muted'}`}>
                            {sale.description}
                        </p>
                    </a>
                ))}
            </div>

            {/* Physical Stores Section */}
            <h2 className="text-lg mb-3 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Store size={20} />
                周辺のスーパー・薬局
            </h2>
            <div className="card mb-8" style={{ padding: '1.5rem 1rem' }}>
                <p className="text-sm text-muted mb-4">
                    現在地から探索して、今日が特売日に該当する周辺店舗をピックアップします。（大手チェーンのみ対応）
                </p>

                <div className="flex flex-col gap-3">
                    <div className="form-group mb-0">
                        <label className="form-label text-sm">探索範囲</label>
                        <div className="flex gap-2">
                            {[10000, 30000, 50000].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setRadius(val)}
                                    className={`btn ${radius === val ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ flex: 1, padding: '0.5rem' }}
                                >
                                    {val / 1000}km
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSearchNearby}
                        disabled={isSearching}
                        className="btn btn-primary mt-2 flex justify-center items-center gap-2"
                        style={{ padding: '0.75rem' }}
                    >
                        {isSearching ? (
                            <>
                                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                <span>周辺を探索中...</span>
                            </>
                        ) : (
                            <>
                                <MapPin size={18} />
                                <span>現在地から探索</span>
                            </>
                        )}
                    </button>
                    {locationError && <p className="text-destructive text-sm m-0 mt-2">{locationError}</p>}
                </div>

                {/* Search Results */}
                {hasSearched && !isSearching && (
                    <div className="slide-up mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <h3 className="text-md mb-3 font-bold">探索結果</h3>
                        {nearbySales.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {nearbySales.map((sale, i) => (
                                    <div key={i} className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--success)', marginBottom: 0 }}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{sale.storeName}</h4>
                                            {sale.distance !== undefined && (
                                                <span className="text-xs font-bold" style={{ background: 'var(--secondary)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                                    ここから約{sale.distance}km
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-bold m-0 mt-2 text-sm" style={{ color: 'var(--destructive)' }}>{sale.description}</p>
                                        {sale.address && (
                                            <p className="text-xs text-muted m-0 mt-2 flex items-center gap-1">
                                                <MapPin size={12} />
                                                {sale.address}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-secondary rounded">
                                <p className="text-muted m-0 text-sm">指定した範囲内に、今日が特売日の対象店舗は見つかりませんでした。</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Rules Management */}
            <h2 className="text-lg mb-3 flex items-center justify-between" style={{ color: 'var(--foreground)' }}>
                <span className="flex items-center gap-2"><Store size={20} /> マイ登録セール</span>
                {!isAddingRule && (
                    <button onClick={() => setIsAddingRule(true)} className="btn btn-outline" style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.875rem' }}>
                        <Plus size={16} /> 追加する
                    </button>
                )}
            </h2>

            {isAddingRule && (
                <form onSubmit={handleAddRule} className="card slide-up mb-6" style={{ border: '1px solid var(--primary)' }}>
                    <h3 className="text-sm font-bold mb-4">新しいお店のセールを登録</h3>
                    <div className="form-group">
                        <label className="form-label">お店の名前</label>
                        <input type="text" className="form-input" required placeholder="例：地元の八百屋" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">特売日（毎月何日？）</label>
                        <div className="flex items-center gap-2">
                            <input type="number" min="1" max="31" required className="form-input" value={newSaleDay} onChange={e => setNewSaleDay(parseInt(e.target.value))} style={{ width: '100px' }} />
                            <span className="font-bold">日</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">セール内容</label>
                        <input type="text" className="form-input" required placeholder="例：全品10%オフ" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                    </div>
                    {ruleError && <p className="text-destructive text-sm mb-4">{ruleError}</p>}
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setIsAddingRule(false)} className="btn btn-outline" style={{ flex: 1 }}>キャンセル</button>
                        <button type="submit" disabled={isSubmittingRule} className="btn btn-primary" style={{ flex: 1 }}>
                            {isSubmittingRule ? "登録中..." : "登録する"}
                        </button>
                    </div>
                </form>
            )}

            <div className="flex flex-col gap-2 mb-8">
                {customRules.length > 0 ? (
                    customRules.map(rule => (
                        <div key={rule.id} className="card flex justify-between items-center" style={{ padding: '0.75rem 1rem', marginBottom: 0 }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{rule.storeName} <span className="text-muted text-sm ml-2">毎月 {rule.saleDay} 日</span></h4>
                                <p className="text-sm text-muted m-0 mt-1">{rule.description}</p>
                            </div>
                            <button onClick={() => handleDeleteRule(rule.id)} className="btn btn-outline text-destructive" style={{ width: 'auto', padding: '0.4rem', border: 'none' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 text-muted border rounded border-dashed cursor-pointer" onClick={() => setIsAddingRule(!isAddingRule)}>
                        登録されたセール情報はありません。<br />ここをタップして近所のお店の特売日を登録しましょう！
                    </div>
                )}
            </div>

        </div>
    );
}
