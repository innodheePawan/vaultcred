'use server';

import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/utils/password';
import { getSecurityState, recordFailure, recordSuccess } from '@/lib/security';

import { getClientIp } from '@/lib/utils/ip';
import { logLoginActivity } from '@/lib/actions/login-activity';

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

    const ip = await getClientIp();

    // 1. Check Security State (IP Blocks, User Locks, Captcha)
    const security = await getSecurityState(email, ip);

    if (security.isIpPermanentBlocked) {
        await logLoginActivity({
            email,
            outcome: 'BLOCKED',
            category: 'AUTHENTICATION',
            reasonCode: 'AUTH_IP_PERMANENT_BLOCKED',
            reasonMessage: 'Authentication blocked: IP is permanently blacklisted.',
            authMethod: 'CREDENTIALS',
            ipAddress: ip
        });
        return { error: 'This IP address is permanently blocked due to repeated security violations.' };
    }

    if (security.isIpBlocked) {
        await logLoginActivity({
            email,
            outcome: 'BLOCKED',
            category: 'AUTHENTICATION',
            reasonCode: 'AUTH_IP_TEMPORARY_BLOCKED',
            reasonMessage: 'Authentication blocked: IP is temporarily throttled.',
            authMethod: 'CREDENTIALS',
            ipAddress: ip
        });
        const retryMinutes = security.blockedUntil ? Math.ceil((security.blockedUntil.getTime() - Date.now()) / 60000) : 4 * 60;
        return { error: `Too many requests from this IP. Please try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.` };
    }

    if (security.isUserLocked) {
        await logLoginActivity({
            email,
            outcome: 'BLOCKED',
            category: 'ACCOUNT_STATUS',
            reasonCode: 'AUTH_USER_LOCKED',
            reasonMessage: 'Access denied: User account is temporarily locked.',
            authMethod: 'CREDENTIALS',
            ipAddress: ip
        });
        const retryMinutes = security.lockExpiresAt ? Math.ceil((security.lockExpiresAt.getTime() - Date.now()) / 60000) : 30;
        return { error: `This account is temporarily locked due to multiple failed login attempts. Please try again in ${retryMinutes} minutes.` };
    }

    const isCaptchaVerified = formData.get('captcha_verified') === 'true';

    if (security.requiresCaptcha && !isCaptchaVerified) {
        // In a real app, we'd verify a captcha token here. 
        // For now, we return a specific error to let the UI know it needs to show a challenge.
        return { error: 'Security challenge required. Please refresh and complete the verification.', requiresCaptcha: true };
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
            await recordFailure(email, ip);
            await logLoginActivity({
                email,
                outcome: 'FAILURE',
                category: 'AUTHENTICATION',
                reasonCode: 'AUTH_USER_NOT_FOUND',
                reasonMessage: 'Authentication failed: No user found with this email.',
                authMethod: 'CREDENTIALS',
                ipAddress: ip
            });
            return { error: 'Invalid email or password.' };
        }

        if (user.status !== 'ACTIVE') {
            await logLoginActivity({
                email,
                outcome: 'BLOCKED',
                category: 'ACCOUNT_STATUS',
                reasonCode: 'AUTH_USER_INACTIVE',
                reasonMessage: 'Access denied: User account is inactive.',
                authMethod: 'CREDENTIALS',
                ipAddress: ip
            });
            return { error: 'Account is inactive.' };
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            await recordFailure(email, ip);
            await logLoginActivity({
                email,
                outcome: 'FAILURE',
                category: 'AUTHENTICATION',
                reasonCode: 'AUTH_INVALID_PASSWORD',
                reasonMessage: 'Authentication failed: Invalid password.',
                authMethod: 'CREDENTIALS',
                ipAddress: ip
            });
            return { error: 'Invalid email or password.' };
        }

        // Credentials valid — reset failure counter so 2FA failures are
        // tracked independently (CAPTCHA will re-trigger after 3 bad 2FA codes).
        await recordSuccess(email, ip);

        // Check if 2FA is required
        return {
            success: true,
            // @ts-ignore
            twoFactorRequired: user.twoFactorEnabled ?? false,
            requiresCaptcha: false
        };
    } catch (error) {
        console.error('[PreLoginCheck] Error:', error);
        return { error: 'An error occurred during login.' };
    }
}
