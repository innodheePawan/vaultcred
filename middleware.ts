import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const authHandler = auth((req) => {
    const path = req.nextUrl.pathname;
    const isApi = path.startsWith('/api') || path.startsWith('/_next') || path.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|json|xml|txt)$/);
    const isSetup = path.startsWith('/setup');

    // SCENARIO: Normal Configured Flow
    const isLogin = path.startsWith('/login');
    const isSetup2fa = path.startsWith('/setup-2fa');
    const isInvite = path.startsWith('/invite');
    const isForgotPassword = path.startsWith('/forgot-password');
    const isResetPassword = path.startsWith('/reset-password');
    const isSignout = path.startsWith('/signout') || path.startsWith('/api/auth/signout');
    const isPublicAuth = isLogin || isInvite || isForgotPassword || isResetPassword;

    // Auth Session
    const isLoggedIn = !!req.auth;
    const twoFactorEnabled = (req.auth?.user as any)?.twoFactorEnabled;
    const isRoot = path === '/';

    // 1. Logged in user accessing login page
    if (isLoggedIn && isLogin) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 2. 2FA Enforcement
    if (isLoggedIn && !twoFactorEnabled && !isSetup2fa && !isSignout && !isApi && !isSetup) {
        return NextResponse.redirect(new URL('/setup-2fa', req.url));
    }

    // 3. Prevent access to setup-2fa if already enabled
    if (isLoggedIn && twoFactorEnabled && isSetup2fa) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 4. Protect private routes
    if (!isLoggedIn && !isPublicAuth && !isApi && !isSetup && !isRoot && !isSetup2fa) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // 5. Block /setup if system is already configured (since we passed the pre-auth checks)
    if (isSetup && !isSetup2fa) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
});

export default async function middleware(req: any) {
    const isSetupMode = String(process.env.SETUP_MODE).trim().toLowerCase() === 'true';
    const dbUrl = process.env.DATABASE_URL;
    const isUnconfigured = !dbUrl || dbUrl.trim() === '';
    const path = req.nextUrl.pathname;

    const isSetup = path.startsWith('/setup');
    const isAsset = path.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|json|xml|txt)$/);
    const isNextInternal = path.startsWith('/_next');
    const isApi = path.startsWith('/api');

    // A. SETUP_MODE BYPASS (Highest Priority)
    if (isSetupMode) {
        if (isSetup || isNextInternal || isAsset) return;
        if (isApi) {
            return new NextResponse(
                JSON.stringify({ error: 'System in Setup Mode. Access restricted.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
        const url = req.nextUrl.clone();
        url.pathname = '/setup';
        return NextResponse.redirect(url);
    }

    // B. UNCONFIGURED BYPASS
    if (isUnconfigured) {
        if (isSetup || isNextInternal || isAsset || isApi) return;
        const url = req.nextUrl.clone();
        url.pathname = '/setup';
        return NextResponse.redirect(url);
    }

    // C. NORMAL AUTH FLOW
    return (authHandler as any)(req);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
