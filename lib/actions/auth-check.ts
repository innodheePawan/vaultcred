'use server';

import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/utils/password';
import { getSecurityState, recordFailure, recordSuccess } from '@/lib/security';
import { logAudit } from '@/lib/actions/audit';
import { headers } from 'next/headers';

/**
 * Pre-login check: validates credentials without creating a session.
 * Returns whether 2FA is required for this user.
 */
export async function preLoginCheck(
    _prevState: any,
    formData: FormData,
) {
    const emailRaw = formData.get('email') as string;
    const email = emailRaw ? emailRaw.trim().toLowerCase() : '';
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required.' };
    }

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';

    // 1. Check Security State (IP Blocks, User Locks, Captcha)
    const security = await getSecurityState(email, ip);

    if (security.isIpPermanentBlocked) {
        return { error: 'This IP address is permanently blocked due to repeated security violations.' };
    }

    if (security.isIpBlocked) {
        const retryMinutes = security.blockedUntil ? Math.ceil((security.blockedUntil.getTime() - Date.now()) / 60000) : 4 * 60;
        return { error: `Too many requests from this IP. Please try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.` };
    }

    if (security.isUserLocked) {
        const retryMinutes = security.lockExpiresAt ? Math.ceil((security.lockExpiresAt.getTime() - Date.now()) / 60000) : 30;
        return { error: `This account is temporarily locked due to multiple failed login attempts. Please try again in ${retryMinutes} minutes.` };
    }

    const isCaptchaVerified = formData.get('captcha_verified') === 'true';

    if (security.requiresCaptcha && !isCaptchaVerified) {
        // In a real app, we'd verify a captcha token here. 
        // For now, we return a specific error to let the UI know it needs to show a challenge.
        return { error: 'Security challenge required. Please refresh and complete the verification.', requiresCaptcha: true };
    }

    // Note: requiresCaptcha logic would go here if we were checking a captcha token.
    // For now, we return the flag to the UI in the response.


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
            await recordFailure(email, ip);
            return { error: 'Invalid email or password.' };
        }

        if (user.status !== 'ACTIVE') {
            return { error: 'Account is inactive.' };
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            await recordFailure(email, ip);
            return { error: 'Invalid email or password.' };
        }

        // Credentials valid — reset failure state for this phase
        // (Full reset happens in authenticate.ts after 2FA check)
        await recordSuccess(email, ip);

        // Credentials valid — check if 2FA is required
        return {
            success: true,
            // @ts-ignore
            twoFactorRequired: user.twoFactorEnabled ?? false,
            requiresCaptcha: false // Valid credentials clear captcha requirement in this phase
        };
    } catch (error) {
        console.error('[PreLoginCheck] Error:', error);
        return { error: 'An error occurred during login.' };
    }
}
