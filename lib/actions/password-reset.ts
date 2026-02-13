'use server';

import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/utils/password';
import { sendPasswordResetEmail } from '@/lib/email';
import { decrypt } from '@/lib/crypto';
import { getSecurityState, recordFailure, recordSuccess } from '@/lib/security';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/actions/audit';
import { logLoginActivity } from '@/lib/actions/login-activity';

/**
 * Request a password reset email.
 * Always returns a success message to prevent user enumeration.
 */
export async function requestPasswordReset(emailRaw: string, formData?: FormData) {
    const email = emailRaw ? emailRaw.trim().toLowerCase() : '';
    try {
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';

        // 1. Check Security State (IP Blocks, User Locks)
        const security = await getSecurityState(email, ip);

        if (security.isIpPermanentBlocked) {
            await logLoginActivity({
                email,
                outcome: 'BLOCKED',
                category: 'AUTHENTICATION',
                reasonCode: 'PWD_RESET_IP_PERMANENT_BLOCKED',
                reasonMessage: 'Password reset blocked: IP is permanently blacklisted.',
                authMethod: 'PASSWORD_RESET',
                ipAddress: ip
            });
            return { error: 'This IP address is permanently blocked due to repeated security violations.' };
        }

        if (security.isIpBlocked) {
            await logLoginActivity({
                email,
                outcome: 'BLOCKED',
                category: 'AUTHENTICATION',
                reasonCode: 'PWD_RESET_IP_TEMPORARY_BLOCKED',
                reasonMessage: 'Password reset blocked: IP is temporarily throttled.',
                authMethod: 'PASSWORD_RESET',
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
                reasonCode: 'PWD_RESET_USER_LOCKED',
                reasonMessage: 'Access denied: User account is temporarily locked.',
                authMethod: 'PASSWORD_RESET',
                ipAddress: ip
            });
            const retryMinutes = security.lockExpiresAt ? Math.ceil((security.lockExpiresAt.getTime() - Date.now()) / 60000) : 30;
            return { error: `This account is temporarily locked. Please try again in ${retryMinutes} minutes.` };
        }

        const isCaptchaVerified = (typeof formData === 'object' && formData instanceof FormData)
            ? formData.get('captcha_verified') === 'true'
            : false;

        if (security.requiresCaptcha && !isCaptchaVerified) {
            return { error: 'Security challenge required.', requiresCaptcha: true };
        }

        const genericMessage = 'If an account with that email exists, we\'ve sent a password reset link.';

        if (security.isIpBlocked || security.isUserLocked) {
            return { success: true, message: genericMessage };
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            await recordFailure(email, ip);
            await logLoginActivity({
                email,
                outcome: 'FAILURE',
                category: 'AUTHENTICATION',
                reasonCode: 'PWD_RESET_USER_NOT_FOUND',
                reasonMessage: 'Password reset failed: No user found with this email.',
                authMethod: 'PASSWORD_RESET',
                ipAddress: ip
            });
            return { success: true, message: genericMessage };
        }


        // Rate limit: max 3 reset requests per email per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentRequests = await prisma.passwordResetToken.count({
            where: {
                email,
                createdAt: { gt: oneHourAgo },
            },
        });

        if (recentRequests >= 3) {
            await logLoginActivity({
                email,
                outcome: 'BLOCKED',
                category: 'AUTHENTICATION',
                reasonCode: 'PWD_RESET_RATE_LIMITED',
                reasonMessage: 'Password reset blocked: Too many requests for this email.',
                authMethod: 'PASSWORD_RESET',
                ipAddress: ip
            });
            return { success: true, message: genericMessage }; // Silent rate limit
        }

        // Invalidate any existing unused tokens for this email
        await prisma.passwordResetToken.updateMany({
            where: { email, used: false },
            data: { used: true },
        });

        // Generate secure token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expiresAt,
            },
        });

        // Send email
        await sendPasswordResetEmail(email, token);

        await logLoginActivity({
            email,
            outcome: 'SUCCESS',
            category: 'AUTHENTICATION',
            reasonCode: 'PWD_RESET_REQUESTED',
            reasonMessage: 'Password reset link sent.',
            authMethod: 'PASSWORD_RESET',
            ipAddress: ip
        });

        return { success: true, message: genericMessage };
    } catch (error) {
        console.error('[Password Reset] Error requesting reset:', error);
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}

/**
 * Validate a reset token. Returns token info + whether user has 2FA.
 */
export async function validateResetToken(token: string) {
    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken) {
            return { valid: false, error: 'Invalid or expired reset link.' };
        }

        if (resetToken.used) {
            return { valid: false, error: 'This reset link has already been used.' };
        }

        if (resetToken.expiresAt < new Date()) {
            return { valid: false, error: 'This reset link has expired. Please request a new one.' };
        }

        // Check if user has 2FA enabled
        const user = await prisma.user.findUnique({
            where: { email: resetToken.email },
            // @ts-ignore
            select: { id: true, email: true, twoFactorEnabled: true },
        });

        if (!user) {
            return { valid: false, error: 'Account not found.' };
        }

        return {
            valid: true,
            email: resetToken.email,
            twoFactorRequired: (user as any).twoFactorEnabled ?? false,
        };
    } catch (error) {
        console.error('[Password Reset] Error validating token:', error);
        return { valid: false, error: 'An unexpected error occurred.' };
    }
}

/**
 * Verify 2FA code during password reset flow.
 */
export async function verifyResetTwoFactor(token: string, code: string) {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    try {
        // Validate token first
        const tokenResult = await validateResetToken(token);
        if (!tokenResult.valid) {
            return { verified: false, error: tokenResult.error };
        }

        // Get user + 2FA secret
        const user = await prisma.user.findUnique({
            where: { email: tokenResult.email },
            // @ts-ignore
            select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
        });

        if (!user || !(user as any).twoFactorEnabled) {
            return { verified: false, error: '2FA is not enabled for this account.' };
        }

        const encryptedSecret = (user as any).twoFactorSecret;
        if (!encryptedSecret) {
            return { verified: false, error: '2FA configuration error.' };
        }

        // Decrypt and verify TOTP
        const secret = decrypt(encryptedSecret);

        // Use top-level verify function from modular otplib v13
        const { verify } = await import('otplib');

        const isValid = await verify({
            token: code,
            secret,
        });

        if (!isValid) {
            await recordFailure(tokenResult.email!, ip);
            await logLoginActivity({
                email: tokenResult.email!,
                outcome: 'FAILURE',
                category: 'MFA',
                reasonCode: 'PWD_RESET_INVALID_MFA',
                reasonMessage: 'Password reset MFA failed: Invalid code.',
                authMethod: '2FA_TOTP',
                ipAddress: ip
            });
            return { verified: false, error: 'Invalid 2FA code. Please try again.' };
        }

        return { verified: true };
    } catch (error) {
        console.error('[Password Reset] Error verifying 2FA:', error);
        return { verified: false, error: 'An unexpected error occurred.' };
    }
}

/**
 * Reset the password. Requires valid token and 2FA code (if enabled).
 */
export async function resetPassword(
    token: string,
    newPassword: string,
    twoFactorCode?: string
) {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    try {
        // Validate token
        const tokenResult = await validateResetToken(token);
        if (!tokenResult.valid) {
            return { error: tokenResult.error };
        }

        // If 2FA is required, verify code
        if (tokenResult.twoFactorRequired) {
            if (!twoFactorCode) {
                return { error: 'Two-Factor Authentication code is required.' };
            }

            const twoFAResult = await verifyResetTwoFactor(token, twoFactorCode);
            if (!twoFAResult.verified) {
                return { error: twoFAResult.error };
            }
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return { error: 'Password must be at least 8 characters.' };
        }

        // Hash and update
        const hashedPassword = await hashPassword(newPassword);

        await prisma.$transaction(async (tx) => {
            // Update password
            await tx.user.update({
                where: { email: tokenResult.email! },
                data: { passwordHash: hashedPassword },
            });

            // Mark token as used
            await tx.passwordResetToken.update({
                where: { token },
                data: { used: true },
            });
        });

        await recordSuccess(tokenResult.email!, ip);

        await logLoginActivity({
            email: tokenResult.email!,
            outcome: 'SUCCESS',
            category: 'AUTHENTICATION',
            reasonCode: 'PWD_RESET_COMPLETE',
            reasonMessage: 'Password reset successful.',
            authMethod: tokenResult.twoFactorRequired ? '2FA_TOTP' : 'PASSWORD_RESET',
            ipAddress: ip
        });

        return { success: true, message: 'Password reset successfully. You can now log in with your new password.' };
    } catch (error) {
        console.error('[Password Reset] Error resetting password:', error);
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}
