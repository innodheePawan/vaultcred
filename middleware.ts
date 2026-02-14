import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    // 1. Check for Setup Mode
    const isSetupMode = process.env.SETUP_MODE === 'true';
    const path = req.nextUrl.pathname;
    const isSetup = path.startsWith('/setup');
    const isApi = path.startsWith('/api') || path.startsWith('/_next') || path.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|json|xml|txt)$/);

    if (isSetupMode) {
        // Allow static assets, images, and the setup page itself
        const isAsset = path.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|json|xml|txt)$/);
        const isNextInternal = path.startsWith('/_next');

        if (isSetup || isNextInternal || isAsset) {
            return;
        }

        // For API calls or other routes, return a restricted access message
        if (path.startsWith('/api')) {
            return new NextResponse(
                JSON.stringify({ error: 'System in Setup Mode. Access restricted.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return NextResponse.redirect(new URL('/setup', req.url));
    }

    // 2. Check for Database Configuration
    const dbUrl = process.env.DATABASE_URL;
    const isUnconfigured = !dbUrl || dbUrl.trim() === '';

    const isLogin = path.startsWith('/login');
    const isSetup2fa = path.startsWith('/setup-2fa');
    const isInvite = path.startsWith('/invite');
    const isForgotPassword = path.startsWith('/forgot-password');
    const isResetPassword = path.startsWith('/reset-password');
    const isSignout = path.startsWith('/signout') || path.startsWith('/api/auth/signout');
    const isPublicAuth = isLogin || isInvite || isForgotPassword || isResetPassword;

    // Auth Session
    const isLoggedIn = !!req.auth;
    const userRole = req.auth?.user?.role;
    // @ts-ignore - twoFactorEnabled is added via callbacks
    const twoFactorEnabled = req.auth?.user?.twoFactorEnabled;

    const isRoot = path === '/';

    // SCENARIO 1: Database NOT Configured
    if (isUnconfigured) {
        if (isApi || isSetup) {
            return;
        }
        return NextResponse.redirect(new URL('/setup', req.url));
    }

    // SCENARIO 2: Database IS Configured

    // If user is logged in and tries to access /login, send to dashboard
    if (isLoggedIn && isLogin) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 2FA Enforcement: Logged-in users without 2FA must set it up
    if (isLoggedIn && !twoFactorEnabled && !isSetup2fa && !isSignout && !isApi && !isSetup) {
        return NextResponse.redirect(new URL('/setup-2fa', req.url));
    }

    // If 2FA is already enabled, block access to setup-2fa
    if (isLoggedIn && twoFactorEnabled && isSetup2fa) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Normal protection for other routes
    if (!isLoggedIn && !isPublicAuth && !isApi && !isSetup && !isRoot && !isSetup2fa) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Block /setup if DB is configured
    if (isSetup && !isSetup2fa) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
