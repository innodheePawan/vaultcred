'use server';

import { prisma } from '@/lib/prisma';
import { randomBytes, timingSafeEqual } from 'crypto';
import { hashPassword } from '@/lib/utils/password';
import { sendPasswordResetEmail } from '@/lib/email';
import { decrypt } from '@/lib/crypto';

/**
 * Request a password reset email.
 * Always returns a success message to prevent user enumeration.
 */
export async function requestPasswordReset(email: string) {
    try {
        // Always respond with the same message regardless of whether the user exists
        const genericMessage = 'If an account with that email exists, we\'ve sent a password reset link.';

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
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
            // @ts-ignore - twoFactorEnabled field
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

        console.log('[2FA] Verification result:', { isValid, codeLen: code.length, secretLen: secret.length });


        if (!isValid) {
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

        return { success: true, message: 'Password reset successfully. You can now log in with your new password.' };
    } catch (error) {
        console.error('[Password Reset] Error resetting password:', error);
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}
