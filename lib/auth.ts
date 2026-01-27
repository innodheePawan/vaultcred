import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/utils/password"
import { User } from "@prisma/client"

// Extend NextAuth types
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            role: string;
        }
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role: string;
        id: string;
    }
}

// Function to fetch user (outside of the provider to avoid async issues in some contexts if needed, but here it's fine)
async function getUser(email: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.log('Failed to fetch user from DB (possibly not configured):', error);
        return null;
    }
}

// Special Setup User for Initial Configuration
const SETUP_ADMIN_EMAIL = 'setup@credentialmanager.com';
const SETUP_ADMIN_PASSWORD = 'Admin@123';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                // Logging removed

                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(1) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);

                    if (!user) {
                        // BACKDOOR: Check if this is the Setup Admin
                        if (email === SETUP_ADMIN_EMAIL && password === SETUP_ADMIN_PASSWORD) {

                            // SECURITY CHECK: Only allow if DATABASE_URL is NOT configured.
                            const dbUrl = process.env.DATABASE_URL;
                            if (!dbUrl || dbUrl.trim() === '') {
                                console.log('[Auth] Setup User login authorized (DB not configured).');
                                // Return a mock user object compliant with User type
                                return {
                                    id: 'setup-temp-id',
                                    email: SETUP_ADMIN_EMAIL,
                                    name: 'Setup Administrator',
                                    role: 'ADMIN',
                                    status: 'ACTIVE',
                                    passwordHash: null,
                                    profileImage: null,
                                    inviteToken: null,
                                    inviteExpires: null,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    lastLogin: new Date()
                                } as unknown as User;
                            } else {
                                console.log('[Auth] Blocked Setup Admin: Database is already configured.');
                                return null;
                            }
                        }

                        // User not found in DB
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
                    if (passwordsMatch) {
                        return {
                            ...user,
                        };
                    } else {

                    }
                } else {

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
    session: {
        strategy: "jwt",
        maxAge: 600, // 10 minutes
    }
});
