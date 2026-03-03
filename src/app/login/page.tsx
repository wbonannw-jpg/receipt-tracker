"use client";

import { signIn } from "next-auth/react";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "var(--background)"
        }}>
            <div className="card" style={{ maxWidth: "360px", width: "100%", textAlign: "center", padding: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <BookOpen size={36} style={{ color: "var(--primary)" }} />
                    <h1 style={{ margin: 0, fontSize: "1.75rem" }}>家計簿</h1>
                </div>
                <p className="text-muted" style={{ marginBottom: "2rem", lineHeight: 1.6 }}>
                    レシートを撮影して<br />かんたん家計管理
                </p>

                <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="btn btn-primary"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", width: "100%", fontSize: "1rem", padding: "0.85rem" }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Googleでログイン
                </button>
            </div>
        </div>
    );
}
