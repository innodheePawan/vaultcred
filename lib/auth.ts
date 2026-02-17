import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/utils/password"
import { User } from "@prisma/client"
import { OTP } from 'otplib';
import { decrypt } from '@/lib/crypto';
import { logLoginActivity } from "@/lib/actions/login-activity";

// OTP instance for verification
const otp = new OTP();

// Extend NextAuth types
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            role: string;
            twoFactorEnabled: boolean;
        }
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role: string;
        id: string;
        twoFactorEnabled: boolean;
    }
}

// Function to fetch user
async function getUser(email: string): Promise<User | null> {
    if (!process.env.DATABASE_URL) return null;
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.log('Failed to fetch user from DB:', error);
        return null;
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(1) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);

                    if (!user) {
                        console.log('[Auth] No user found');
                        await logLoginActivity({
                            email,
                            outcome: 'FAILURE',
                            category: 'AUTHENTICATION',
                            reasonCode: 'AUTH_USER_NOT_FOUND',
                            reasonMessage: 'Authentication failed: No user found with this email.',
                            authMethod: 'CREDENTIALS'
                        });
                        return null;
                    }

                    if (user.status !== 'ACTIVE') {
                        console.log(`[Auth] Blocked login for inactive user: ${email}`);
                        await logLoginActivity({
                            email,
                            outcome: 'BLOCKED',
                            category: 'ACCOUNT_STATUS',
                            reasonCode: 'AUTH_USER_INACTIVE',
                            reasonMessage: 'Access denied: User account is inactive.',
                            authMethod: 'CREDENTIALS'
                        });
                        return null;
                    }

                    if (!user.passwordHash) {
                        return null;
                    }

                    const passwordsMatch = await verifyPassword(password, user.passwordHash);
                    if (!passwordsMatch) {
                        await logLoginActivity({
                            email,
                            outcome: 'FAILURE',
                            category: 'AUTHENTICATION',
                            reasonCode: 'AUTH_INVALID_PASSWORD',
                            reasonMessage: 'Authentication failed: Invalid password.',
                            authMethod: 'CREDENTIALS'
                        });
                        return null;
                    }

                    // 2FA Verification
                    // @ts-ignore - Prisma types may be stale
                    if (user.twoFactorEnabled) {
                        const twoFactorCode = (credentials as any).code as string | undefined;

                        if (!twoFactorCode) {
                            // No code provided — reject (frontend should have prompted)
                            await logLoginActivity({
                                email,
                                outcome: 'FAILURE',
                                category: 'MFA',
                                reasonCode: 'AUTH_MFA_REQUIRED',
                                reasonMessage: 'MFA required but not provided.',
                                authMethod: '2FA_TOTP'
                            });
                            return null;
                        }

                        // @ts-ignore
                        if (!user.twoFactorSecret) return null;
                        // @ts-ignore
                        const secret = decrypt(user.twoFactorSecret);

                        try {
                            const result = await otp.verify({
                                token: twoFactorCode,
                                secret,
                            });
                            const isValid = result && result.valid;
                            if (!isValid) {
                                await logLoginActivity({
                                    email,
                                    outcome: 'FAILURE',
                                    category: 'MFA',
                                    reasonCode: 'AUTH_INVALID_MFA',
                                    reasonMessage: 'MFA verification failed: Invalid code.',
                                    authMethod: '2FA_TOTP'
                                });
                                return null;
                            }
                        } catch (error) {
                            console.error('[Auth] 2FA Verify Error:', error);
                            return null;
                        }
                    }

                    await logLoginActivity({
                        email,
                        outcome: 'SUCCESS',
                        category: 'AUTHENTICATION',
                        reasonCode: 'AUTH_SUCCESS',
                        reasonMessage: 'Login successful.',
                        authMethod: user.twoFactorEnabled ? '2FA_TOTP' : 'CREDENTIALS'
                    });

                    return {
                        ...user,
                        // @ts-ignore
                        twoFactorEnabled: user.twoFactorEnabled,
                    };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as User).role;
                token.id = (user as User).id;
                token.twoFactorEnabled = (user as any).twoFactorEnabled;
            } else if (token.id) {
                // Refresh twoFactorEnabled from DB on every token refresh
                // so that enabling/disabling 2FA takes effect immediately
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { twoFactorEnabled: true },
                    });

                    // GHOST SESSION PROTECTION:
                    // If user was deleted from DB but session persists in cookie
                    if (!dbUser) {
                        return null as any;
                    }

                    token.twoFactorEnabled = dbUser.twoFactorEnabled;
                } catch (e) {
                    // If DB is unavailable, keep existing token value
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            const { getBaseUrl } = await import("@/lib/utils/url");
            const dynamicBaseUrl = await getBaseUrl();

            // Allow relative paths
            if (url.startsWith("/")) return `${dynamicBaseUrl}${url}`;

            // Allow redirects to the same origin
            try {
                const urlObj = new URL(url);
                const baseUrlObj = new URL(dynamicBaseUrl);
                if (urlObj.origin === baseUrlObj.origin) return url;
            } catch (e) {
                // If invalid URL, fallback
            }

            return dynamicBaseUrl;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 600, // 10 minutes
    },
});
