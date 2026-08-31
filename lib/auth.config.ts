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

            // SAFEGUARD: If SETUP_MODE is active, refuse authorization for all protected pages
            // This forces the middleware to handle the redirection to /setup.
            const rawSetupMode = process.env.SETUP_MODE || process.env.NEXT_PUBLIC_SETUP_MODE || "false";
            const isSetupMode = String(rawSetupMode).trim().toLowerCase() === "true";

            if (isSetupMode && isProtected) {
                return false;
            }

            // Force External Users to /credentials if they try to access /dashboard
            if (isLoggedIn && (auth.user as any)?.isExternal && nextUrl.pathname.startsWith('/dashboard')) {
                return Response.redirect(new URL('/credentials', nextUrl));
            }

            if (isProtected) {
                if (isLoggedIn) {

                    if (nextUrl.pathname.startsWith('/admin') && (auth.user as any)?.role !== 'ADMIN' && (auth.user as any)?.role !== 'SUPER_ADMIN') {
                        return false;
                    }
                    return true;
                }
                return false; // Redirect unauthenticated users to login page
            }

            // Redirect logged-in users away from login page
            if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
                const isExternal = (auth?.user as any)?.isExternal;
                if (isExternal) {
                    return Response.redirect(new URL('/credentials', nextUrl));
                }
                return Response.redirect(new URL('/dashboard', nextUrl));
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            // Server-Side Heartbeat for Session Timeout (15 minutes = 900,000 ms)
            const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
            const now = Date.now();

            if (user) {
                token.role = (user as any).role;
                token.id = (user as any).id;
                token.twoFactorEnabled = (user as any).twoFactorEnabled;
                token.isExternal = (user as any).isExternal;
                token.accessExpiresAt = (user as any).accessExpiresAt || null;
                token.vendorName = (user as any).vendorName || null;
                token.externalAccessType = (user as any).externalAccessType || null;
                token.lastActivity = now; // Initialize heartbeat on login
            } else if (trigger === "update" && session) {
                // Client-side session override
                if (session.twoFactorEnabled !== undefined) {
                    token.twoFactorEnabled = session.twoFactorEnabled;
                }
            } else if (token.lastActivity) {
                // Check if session has expired due to inactivity
                if (now - (token.lastActivity as number) > SESSION_TIMEOUT_MS) {
                    return null; // Return null to destroy the token and force unauthenticated state
                }
                // Refresh heartbeat
                token.lastActivity = now;
            }

            // DB-specific enrichment (refreshing state) - only run on Node.js server, NOT in Edge Middleware
            if (process.env.NEXT_RUNTIME !== 'edge' && token?.id) {
                try {
                    const { prisma } = await import('@/lib/prisma');
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: {
                            id: true,
                            twoFactorEnabled: true,
                            status: true,
                            isExternal: true,
                            externalAccessType: true,
                            accessExpiresAt: true,
                            vendorName: true,
                            role: true,
                        },
                    }) as any;

                    if (dbUser && dbUser.status === 'ACTIVE') {
                        token.twoFactorEnabled = dbUser.twoFactorEnabled;
                        token.isExternal = dbUser.isExternal;
                        token.externalAccessType = dbUser.externalAccessType;
                        token.accessExpiresAt = dbUser.accessExpiresAt?.toISOString() || null;
                        token.vendorName = dbUser.vendorName;
                        token.role = dbUser.role;
                        token.isActive = true;

                        const { getUserAccessContext } = await import('@/lib/iam/permissions');
                        const ctx = await getUserAccessContext(token.id as string, { rbac: token.rbac });
                        token.rbac = {
                            featurePermissions: ctx.featurePermissions,
                            allowedCategories: ctx.allowedCategories,
                            allowedEnvironments: ctx.allowedEnvironments,
                            allowedCredentialIds: ctx.allowedCredentialIds,
                            version: ctx.version
                        };

                        if (process.env.NODE_ENV === 'development') {
                            const size = JSON.stringify(token.rbac).length;
                            if (size > 5000) {
                                console.warn(`RBAC payload too large: ${size} bytes`);
                            }
                        }
                    } else if (dbUser && dbUser.status !== 'ACTIVE') {
                        token.isActive = false;
                    }
                } catch (e) {
                    // DB error in middleware/edge is common, safely continue with existing token
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
                // @ts-ignore
                session.user.isExternal = token.isExternal as boolean;
                // @ts-ignore
                session.user.accessExpiresAt = token.accessExpiresAt as string | null;
                // @ts-ignore
                session.user.vendorName = token.vendorName as string | null;
                // @ts-ignore
                session.user.externalAccessType = token.externalAccessType as string | null;
                // @ts-ignore
                session.user.isActive = token.isActive as boolean | undefined;
                // @ts-ignore
                session.user.rbac = token.rbac;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'initial-setup-secret-placeholder-change-this-later',
    trustHost: true,
} satisfies NextAuthConfig;
