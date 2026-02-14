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
                nextUrl.pathname.startsWith('/settings');

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
                token.twoFactorEnabled = (user as any).twoFactorEnabled;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'initial-setup-secret-placeholder-change-this-later',
    trustHost: true,
} satisfies NextAuthConfig;
