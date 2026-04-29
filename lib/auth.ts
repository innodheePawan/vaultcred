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
            isExternal: boolean;
            accessExpiresAt: string | null;
            vendorName: string | null;
            externalAccessType: string | null;
            isActive?: boolean;
            rbac?: {
                featurePermissions: Record<string, string>;
                allowedCategories: string[];
                allowedEnvironments: string[];
                version: number;
            };
        }
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role: string;
        id: string;
        twoFactorEnabled: boolean;
        isExternal: boolean;
        accessExpiresAt: string | null;
        vendorName: string | null;
        externalAccessType: string | null;
        isActive?: boolean;
        rbac?: any;
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
                            // otplib verify returns boolean directly, but some wrappers return { valid: boolean }
                            const isValid = typeof result === 'boolean' ? result : (result && (result as any).valid);
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
                        // @ts-ignore
                        isExternal: user.isExternal,
                        // @ts-ignore
                        accessExpiresAt: user.accessExpiresAt?.toISOString() || null,
                        // @ts-ignore
                        vendorName: user.vendorName,
                        // @ts-ignore
                        externalAccessType: user.externalAccessType,
                    };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Use the shared JWT logic from authConfig which handles DB refresh
            if (authConfig.callbacks?.jwt) {
                const refreshedToken = await authConfig.callbacks.jwt({ token, user, trigger } as any);
                if (refreshedToken === null) return token; // Not perfect for NextAuth core, but `null` destroys it in Auth.js v5
                token = refreshedToken;
            }
            return token;
        },
        async session({ session, token }) {
            // Apply common session enrichment from authConfig
            if (authConfig.callbacks?.session) {
                session = await (authConfig.callbacks.session as any)({ session, token });
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Use the dynamic redirect logic
            const { getBaseUrl } = await import("@/lib/utils/url");
            const dynamicBaseUrl = await getBaseUrl();
            if (url.startsWith("/")) return `${dynamicBaseUrl}${url}`;
            try {
                const urlObj = new URL(url);
                const baseUrlObj = new URL(dynamicBaseUrl);
                if (urlObj.origin === baseUrlObj.origin) return url;
            } catch (e) { }
            return dynamicBaseUrl;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 86400, // 24 hours (Client Idle Timer handles the 15m inactivity logout)
    },
});
