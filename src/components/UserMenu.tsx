"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function UserMenu() {
    const { data: session } = useSession();

    if (!session?.user) return null;

    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-outline flex items-center justify-center gap-2"
            style={{ width: "auto", padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
        >
            <LogOut size={18} />
            ログアウト
        </button>
    );
}
