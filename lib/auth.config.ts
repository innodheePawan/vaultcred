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
                    if (nextUrl.pathname.startsWith('/admin') && (auth.user as any)?.role !== 'ADMIN') {
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
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
