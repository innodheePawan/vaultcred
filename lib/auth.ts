import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/utils/password"
import { User } from "@prisma/client"
import { OTP } from 'otplib';
import { decrypt } from '@/lib/crypto';

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
                        return null;
                    }

                    if (user.status !== 'ACTIVE') {
                        console.log(`[Auth] Blocked login for inactive user: ${email}`);
                        return null;
                    }

                    if (!user.passwordHash) {
                        return null;
                    }

                    const passwordsMatch = await verifyPassword(password, user.passwordHash);
                    if (!passwordsMatch) {
                        return null;
                    }

                    // 2FA Verification
                    // @ts-ignore - Prisma types may be stale
                    if (user.twoFactorEnabled) {
                        const twoFactorCode = (credentials as any).code as string | undefined;

                        if (!twoFactorCode) {
                            // No code provided — reject (frontend should have prompted)
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
                            if (!isValid) return null;
                        } catch (error) {
                            console.error('[Auth] 2FA Verify Error:', error);
                            return null;
                        }
                    }

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
                    if (dbUser) {
                        token.twoFactorEnabled = dbUser.twoFactorEnabled;
                    }
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
            const effectiveBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || baseUrl;
            const cleanBaseUrl = effectiveBaseUrl.endsWith('/') ? effectiveBaseUrl.slice(0, -1) : effectiveBaseUrl;

            if (url.startsWith("/")) return `${cleanBaseUrl}${url}`
            if (new URL(url).origin === cleanBaseUrl) return url
            if (process.env.NEXT_PUBLIC_APP_URL && url.startsWith(process.env.NEXT_PUBLIC_APP_URL)) {
                return url;
            }

            return cleanBaseUrl;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 600, // 10 minutes
    },
});
