import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;

            // Protect dashboard and admin routes
            const isProtected = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/credentials') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/profile') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/profile') ||
                nextUrl.pathname.startsWith('/settings');

            // Setup User Handling OR Missing Database Configuration
            const isDbMissing = !process.env.DATABASE_URL;

            // 1. If DB is missing, allow setup and essential routes without auth
            if (isDbMissing) {
                const isLogin = nextUrl.pathname.startsWith('/login');
                const isApi = nextUrl.pathname.startsWith('/api') || nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.includes('.');
                const isSetup = nextUrl.pathname.startsWith('/setup');
                const isInvite = nextUrl.pathname.startsWith('/invite');
                const isRoot = nextUrl.pathname === '/';

                if (isLogin || isApi || isSetup || isRoot || isInvite) return true;

                // Redirect to /setup instead of /login when DB is not configured
                return Response.redirect(new URL('/setup', nextUrl));
            }

            if (isProtected) {
                if (isLoggedIn) {
                    // DEBUG LOG
                    console.log(`[AuthDebug] Path: ${nextUrl.pathname}, User: ${auth.user?.email}, Role: ${(auth.user as any)?.role}`);

                    if (nextUrl.pathname.startsWith('/admin') && (auth.user as any)?.role !== 'ADMIN') {
                        console.log('[AuthDebug] Access Denied: Not Admin');
                        return false;
                    }
                    return true;
                }
                return false; // Redirect unauthenticated users to login page
            }

            // Redirect logged-in users away from login page
            if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = (user as any).id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
} satisfies NextAuthConfig;
