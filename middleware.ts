import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    // 1. Check for Database Configuration
    const dbUrl = process.env.DATABASE_URL;
    const isUnconfigured = !dbUrl || dbUrl.trim() === '';

    const path = req.nextUrl.pathname;
    const isLogin = path.startsWith('/login');
    const isSetup = path.startsWith('/setup');
    const isInvite = path.startsWith('/invite');
    const isApi = path.startsWith('/api') || path.startsWith('/_next') || path.includes('.');

    // Auth Session
    const isLoggedIn = !!req.auth;
    const userRole = req.auth?.user?.role;

    const isRoot = path === '/';

    // SCENARIO 1: Database NOT Configured
    if (isUnconfigured) {
        // Allow API, Static assets, and the Setup page itself
        if (isApi || isSetup) {
            return;
        }

        // Redirect everything else (including /login and /) to /setup
        return NextResponse.redirect(new URL('/setup', req.url));
    }

    // SCENARIO 2: Database IS Configured
    // If user is logged in and tries to access /login, send to dashboard
    if (isLoggedIn && isLogin) {
        // Optional: If you want /login to redirect to dashboard when logged in
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Normal protection for other routes is implicit via Matcher + Auth Wrapper?
    // Actually, `auth()` middleware by default doesn't redirect unless we tell it to or use `authorized` callback in auth.config.
    // Let's add basic protection here for safety.
    // Allow root page to be visible to guests? Yes.
    // Dashboard protection
    if (!isLoggedIn && !isLogin && !isApi && !isSetup && !isRoot && !isInvite) { // Protect Dashboard, allow Root & Invite
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Block /setup if DB is configured? 
    // Yes, usually.
    if (isSetup) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
