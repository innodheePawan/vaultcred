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
    const isReconfigure2fa = path.startsWith('/reconfigure-2fa');
    const isSignout = path.startsWith('/signout') || path.startsWith('/api/auth/signout');
    const isEnvValue_auth = path.startsWith('/env-value');
    const isShare = path.startsWith('/share');
    const isActivation = path.startsWith('/activation');
    const isPublicAuth = isLogin || isInvite || isForgotPassword || isResetPassword || isEnvValue_auth || isReconfigure2fa || isShare || isActivation;

    // Auth Session
    const isLoggedIn = !!req.auth;
    const user = req.auth?.user as any;

    // Use optional chaining and defaults to avoid undefined issues in middleware
    const twoFactorEnabled = user?.twoFactorEnabled ?? false;
    const isExternal = user?.isExternal ?? false;
    const accessExpiresAt = user?.accessExpiresAt; // ISO string

    const isRoot = path === '/';
    const isDashboard = path.startsWith('/dashboard');
    const isVendorAccess = path.startsWith('/vendor/access');

    // 1. Logged in user accessing login page
    if (isLoggedIn && isLogin) {
        if (isExternal) {
            return NextResponse.redirect(new URL('/credentials', req.url));
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 1b. External User Expiry Check
    if (isLoggedIn && isExternal && accessExpiresAt) {
        const expiryDate = new Date(accessExpiresAt);
        if (expiryDate < new Date()) {

            return NextResponse.redirect(new URL('/signout', req.url));
        }
    }

    // 1c. External User Restricted Access (Strictly Admin/Settings)
    // External vendors can access /credentials (their new landing) and its sub-routes.
    const restrictedBasePaths = ['/admin', '/settings', '/one-time-secrets'];
    const isAttemptingRestricted = restrictedBasePaths.some(p => path.startsWith(p));

    if (isLoggedIn && isExternal && isAttemptingRestricted) {
        return NextResponse.redirect(new URL('/credentials', req.url));
    }

    // 2. 2FA Enforcement
    // Strictly enforce 2FA for all logged-in users who haven't set it up yet.
    // Exceptions: setup-2fa page itself, signout, internal next/api assets, and the root/setup paths.
    if (isLoggedIn && !twoFactorEnabled && !isSetup2fa && !isSignout && !isApi && !isSetup && !isRoot) {

        return NextResponse.redirect(new URL('/setup-2fa', req.url));
    }

    // 3. Prevent access to setup-2fa if already enabled
    if (isLoggedIn && twoFactorEnabled && isSetup2fa) {
        if (isExternal) {
            return NextResponse.redirect(new URL('/credentials', req.url));
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 4. Protect private routes
    if (!isLoggedIn && !isPublicAuth && !isApi && !isSetup && !isRoot && !isSetup2fa) {
        // Avoid redirect loop if already at /login (though isLogin check above handles it)
        if (!isLogin) {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    // 5. Block /setup if system is already configured
    if (isSetup && !isSetup2fa && !isApi) {
        if (isLoggedIn) {
            if (isExternal) {
                return NextResponse.redirect(new URL('/vendor/access', req.url));
            }
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }
});

export default async function middleware(req: any) {
    const rawSetupMode = process.env.SETUP_MODE || process.env.NEXT_PUBLIC_SETUP_MODE || "false";
    const isSetupMode = String(rawSetupMode).trim().toLowerCase() === "true";

    const dbUrl = process.env.DATABASE_URL;
    const isUnconfigured = !dbUrl || dbUrl.trim() === '';
    const path = req.nextUrl.pathname;

    const isSetup = path.startsWith('/setup');
    const isEnvValue = path.startsWith('/env-value');
    const isAsset = path.match(/\.(png|jpg|jpeg|gif|ico|svg|css|js|json|xml|txt)$/);
    const isNextInternal = path.startsWith('/_next');
    const isApi = path.startsWith('/api');

    // A. SETUP_MODE BYPASS (Highest Priority)
    if (isSetupMode) {
        // If we're at root, force to /setup
        if (path === '/') {
            const url = req.nextUrl.clone();
            url.pathname = '/setup';
            return NextResponse.redirect(url);
        }

        if (isSetup || isEnvValue || isNextInternal || isAsset) return;

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
        if (isSetup || isEnvValue || isNextInternal || isAsset || isApi) return;
        const url = req.nextUrl.clone();
        url.pathname = '/setup';
        return NextResponse.redirect(url);
    }

    // B2. ACTIVATION & LICENSE ENFORCEMENT CHECK
    const isSetupValidation = path.startsWith('/setup-validation');
    const isEnvValue_auth = path.startsWith('/env-value');

    // Always allowed routes
    const isActivation = path.startsWith('/activation');
    const isActivationApi = path.startsWith('/api/activate') || path.startsWith('/api/internal/license-state');
    const isHealthEndpoint = path === '/api/health';

    // Check License State
    let licenseState = 'VALID'; // Default to valid if check fails to prevent hard bricking, unless we actually get UNACTIVATED

    // We only perform the expensive fetch if it's not a pre-allowed asset/api
    if (!isAsset && !isNextInternal && !isActivationApi && !isHealthEndpoint) {
        try {
            const origin = req.nextUrl.origin || 'http://localhost:3000';
            const stateUrl = new URL('/api/internal/license-state', origin);
            // Quick 2500ms timeout fetch to ensure middleware doesn't hang (larger for dev environments)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const res = await fetch(stateUrl.toString(), { signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                licenseState = data.state || 'UNACTIVATED';
            }
        } catch (error) {

            // Fallback strategy: if the internal API is unreachable on boot, we should not block immediately,
            // but the BRD says "If DB unreachable -> system remains operational...".
            // So we default to 'VALID' temporarily if fetch throws (e.g., server booting up),
            // except the BRD actually says the internal API will return UNACTIVATED if Engine fails completely.
        }
    }

    // Apply strict routing rules
    if (licenseState === 'UNACTIVATED' || licenseState === 'COMPROMISED') {
        const isAllowed = isActivation || isActivationApi || isAsset || isNextInternal || isHealthEndpoint || path === '/';

        if (!isAllowed) {
            if (isApi) {
                return new NextResponse(
                    JSON.stringify({ error: `System is ${licenseState}. Access restricted.` }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
            const url = req.nextUrl.clone();
            url.pathname = '/activation';
            return NextResponse.redirect(url);
        }
    }

    if (licenseState === 'LOCKED') {
        const isAllowed = isActivation || isActivationApi || isAsset || isNextInternal || isHealthEndpoint || path.startsWith('/login');

        if (!isAllowed) {
            // Check if authenticated user is SUPERUSER
            const isLoggedIn = !!req?.auth;
            const userRole = (req?.auth?.user as any)?.role;
            const isSuperUser = isLoggedIn && userRole === 'SUPERUSER';

            if (!isSuperUser) {
                if (isApi) {
                    return new NextResponse(
                        JSON.stringify({ error: `License is LOCKED. Access restricted.` }),
                        { status: 403, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                const url = req.nextUrl.clone();
                url.pathname = '/activation';
                return NextResponse.redirect(url);
            }
        }
    }

    if (licenseState === 'VALID' || licenseState === 'GRACE') {
        if (isActivation && !isActivationApi) {
            const hasSessionToken = req.cookies.has('next-auth.session-token') || req.cookies.has('__Secure-next-auth.session-token');
            if (!hasSessionToken) {
                const url = req.nextUrl.clone();
                url.pathname = '/login';
                return NextResponse.redirect(url);
            }
        }
    }

    // C. NORMAL AUTH FLOW
    return (authHandler as any)(req);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
