import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    // 1. Check for Database Configuration
    const dbUrl = process.env.DATABASE_URL;
    const isSetupPage = req.nextUrl.pathname.startsWith('/setup');
    const isApi = req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.includes('.');

    // If DB is NOT configured and we are NOT on the setup page (or static/api), redirect to /setup
    if ((!dbUrl || dbUrl.trim() === '') && !isSetupPage && !isApi) {
        console.log('[Middleware] Database not configured. Redirecting to /setup');
        return NextResponse.redirect(new URL('/setup', req.url));
    }

    // 2. Standard Auth Logic (handled by NextAuth wrapper effectively, but we can return response)
    // If we are on setup page and DB IS configured, redirect to login? 
    // Maybe let the user decide, but usually setup should be locked if DB exists.
    // For now, let's keep it simple: Focus on unconfigured state.
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
