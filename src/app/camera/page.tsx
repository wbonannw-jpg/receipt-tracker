"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image as ImageIcon, Loader2, ArrowLeft } from "lucide-react";

export default function CameraPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "アップロードに失敗しました");
            }

            const data = await res.json();

            // 結果画面に渡すために sessionStorage に保存
            sessionStorage.setItem("receiptResult", JSON.stringify({
                ...data,
                imageUrl: URL.createObjectURL(file) // ローカルでのプレビュー用
            }));

            router.push("/camera/result");
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="slide-up">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="btn" style={{ padding: '0.5rem', width: 'auto', background: 'transparent' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ marginBottom: 0 }}>レシート読み取り</h1>
            </div>

            <p className="text-muted mb-6">
                カメラでレシートを撮影するか、画像を選択してAIに解析させます。
            </p>

            {error && (
                <div className="card mb-4" style={{ borderColor: 'var(--destructive)', backgroundColor: '#fef2f2' }}>
                    <p style={{ color: 'var(--destructive)', margin: 0, fontWeight: 500 }}>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="card flex flex-col items-center justify-center p-8 slide-up text-center">
                    <Loader2 size={48} className="spinner text-primary mb-4" />
                    <h3 className="text-lg">AIが解析中です...</h3>
                    <p className="text-muted text-sm mt-2">しばらくお待ちください。通常数秒〜十数秒で完了します。</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={fileInputRef}
                        className="hidden"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    <button
                        className="btn btn-primary"
                        style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'auto' }}
                        onClick={() => {
                            if (fileInputRef.current) {
                                // Remove capture attribute to allow picking from gallery on some devices
                                fileInputRef.current.removeAttribute('capture');
                                fileInputRef.current.click();
                            }
                        }}
                    >
                        <ImageIcon size={48} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>画像を選択する</span>
                    </button>

                    <button
                        className="btn btn-secondary"
                        style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'auto' }}
                        onClick={() => {
                            if (fileInputRef.current) {
                                fileInputRef.current.setAttribute('capture', 'environment');
                                fileInputRef.current.click();
                            }
                        }}
                    >
                        <Camera size={36} />
                        <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>カメラを起動する</span>
                    </button>
                </div>
            )}
        </div>
    );
}
