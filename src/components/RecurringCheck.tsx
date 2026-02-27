"use client";

import { useEffect } from "react";

export default function RecurringCheck() {
    useEffect(() => {
        // Trigger the recurring entries check silently in the background
        fetch("/api/cron/recurring", { method: "POST" }).catch(e => console.error("Auto recurring check failed:", e));
    }, []);

    return null;
}
