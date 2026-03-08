import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

let auth: any;
try {
    const authResult = NextAuth(authConfig);
    auth = authResult.auth;
} catch (error: any) {
    auth = (req: any) => {
        return NextResponse.json({ error: "Middleware Init Error: " + error.message, stack: error.stack }, { status: 500 });
    };
}

export default auth((req: any) => {
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
