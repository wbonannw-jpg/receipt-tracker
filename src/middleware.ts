import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

let middleware: any;
let initError: Error | null = null;

try {
    const { auth } = NextAuth(authConfig);
    middleware = auth((req) => {
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
} catch (e: any) {
    initError = e;
}

export default async function customMiddleware(req: any, ev: any) {
    if (initError) {
        return NextResponse.json({ error: "Middleware Init Error: " + initError.message, env: process.env.NODE_ENV }, { status: 500 });
    }
    try {
        // @ts-ignore
        return await middleware(req, ev);
    } catch (error: any) {
        return NextResponse.json({ error: "Middleware Exec Error: " + error.message, stack: error.stack }, { status: 500 });
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest).*)"],
};
