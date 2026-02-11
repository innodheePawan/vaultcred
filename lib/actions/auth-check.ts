'use server';

import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/utils/password';

/**
 * Pre-login check: validates credentials without creating a session.
 * Returns whether 2FA is required for this user.
 */
export async function preLoginCheck(
    _prevState: any,
    formData: FormData,
) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required.' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                passwordHash: true,
                status: true,
                // @ts-ignore - Prisma types may be stale
                twoFactorEnabled: true,
            },
        });

        if (!user || !user.passwordHash) {
            return { error: 'Invalid email or password.' };
        }

        if (user.status !== 'ACTIVE') {
            return { error: 'Account is inactive.' };
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            return { error: 'Invalid email or password.' };
        }

        // Credentials valid — check if 2FA is required
        return {
            success: true,
            // @ts-ignore
            twoFactorRequired: user.twoFactorEnabled ?? false,
        };
    } catch (error) {
        console.error('[PreLoginCheck] Error:', error);
        return { error: 'An error occurred during login.' };
    }
}
