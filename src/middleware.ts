import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (pathname.startsWith("/login") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/places")) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users to login
    if (!req.auth) {
        const loginUrl = new URL("/login", req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest).*)"],
};
