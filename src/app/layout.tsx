import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Home } from "lucide-react";
import { SessionProvider } from "next-auth/react";
import UserMenu from "@/components/UserMenu";

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
        <SessionProvider>
          <header className="header">
            <div className="container header-content">
              <Link href="/" className="header-title">
                🧾 Receipt Tracker
              </Link>
              <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, flexWrap: 'nowrap' }}>
                <Link href="/" className="btn btn-outline flex items-center justify-center gap-2" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>
                  <Home size={18} />
                  ホーム
                </Link>
                <UserMenu />
              </nav>
            </div>
          </header>
          <main className="container main-content fade-in">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
