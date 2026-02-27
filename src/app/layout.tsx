import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Camera, Home } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: " Receipt Tracker - 家計簿アプリ",
  description: "AIレシート解析で簡単家計簿",
  manifest: "/manifest.json",
  themeColor: "#16a34a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "家計簿",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <header className="header">
          <div className="container header-content">
            <Link href="/" className="header-title">
              🧾 Receipt Tracker
            </Link>
            <nav className="flex gap-4">
              <Link href="/" className="flex flex-col items-center gap-1 text-sm text-muted slide-up" style={{ textDecoration: 'none' }}>
                <Home size={20} />
                <span>ホーム</span>
              </Link>
              <Link href="/camera" className="flex flex-col items-center gap-1 text-sm text-primary slide-up" style={{ textDecoration: 'none' }}>
                <Camera size={20} />
                <span>撮影</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="container main-content fade-in">
          {children}
        </main>
      </body>
    </html>
  );
}
