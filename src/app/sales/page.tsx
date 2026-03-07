"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, ExternalLink, ShoppingBag, Store, Search } from "lucide-react";
import { getOnlineSales, checkPhysicalStoreSale, SalePlatformStatus, PhysicalStoreSaleStatus } from "@/lib/salesRules";

type PlaceContext = {
    name: string;
    distance?: number;
    address?: string;
};

export default function SalesPage() {
    const [onlineSales, setOnlineSales] = useState<SalePlatformStatus[]>([]);

    // GPS & Places Search State
    const [radius, setRadius] = useState<number>(30000); // default 30km
    const [isSearching, setIsSearching] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [nearbySales, setNearbySales] = useState<PhysicalStoreSaleStatus[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        // Load online sales immediately
        setOnlineSales(getOnlineSales(new Date()));
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

    return (
        <div className="slide-up">
            <div className="flex items-center justify-between mb-6">
                <Link href="/" className="btn btn-outline flex items-center gap-2" style={{ width: 'auto', padding: '0.5rem 0.75rem', border: 'none' }}>
                    <ArrowLeft size={24} />
                    <span className="font-bold">ホーム</span>
                </Link>
                <h1 style={{ margin: 0, fontSize: '1.25rem' }}>今日のセール情報</h1>
            </div>

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
            <div className="card mb-6" style={{ padding: '1.5rem 1rem' }}>
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
            </div>

            {/* Search Results */}
            {hasSearched && !isSearching && (
                <div className="slide-up">
                    <h3 className="text-md mb-3 font-bold">探索結果</h3>
                    {nearbySales.length > 0 ? (
                        <div className="flex flex-col gap-3 mb-8">
                            {nearbySales.map((sale, i) => (
                                <div key={i} className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--success)' }}>
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
                        <div className="card text-center py-8">
                            <p className="text-muted m-0">指定した範囲内に、今日が特売日の対象店舗は見つかりませんでした。</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


