"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // public routes like /login skip the check
        const isPublicRoute = pathname === "/login" || pathname?.startsWith("/api/");
        
        if (status === "unauthenticated" && !isPublicRoute) {
            router.replace("/login");
        }
    }, [status, pathname, router]);

    // OPTIONAL: block rendering until authenticated
    // if (status === "loading") {
    //     return <div className="flex h-screen w-full items-center justify-center"><div className="spinner"></div></div>;
    // }
    // if (status === "unauthenticated") {
    //     return null; // prevent flash of UI before redirect
    // }

    return <>{children}</>;
}
