"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import Image from "next/image";

export default function UserMenu() {
    const { data: session } = useSession();

    if (!session?.user) return null;

    return (
        <div className="flex items-center gap-2">
            {session.user.image && (
                <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    style={{ borderRadius: "50%", border: "2px solid var(--primary)" }}
                />
            )}
            <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex flex-col items-center gap-1 text-sm"
                style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0 }}
                title="ログアウト"
            >
                <LogOut size={20} />
                <span>ログアウト</span>
            </button>
        </div>
    );
}
