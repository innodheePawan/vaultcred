'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { OTP } from 'otplib';
import QRCode from 'qrcode';
import { headers } from 'next/headers';
import { getClientIp } from '@/lib/utils/ip';
import { getSecurityState, recordFailure, recordSuccess } from '@/lib/security';
import { logLoginActivity } from '@/lib/actions/login-activity';
import { sendTwoFactorReconfigureEmail } from '@/lib/email';
import crypto from 'crypto';
import { verifyPassword } from '@/lib/utils/password';

/**
 * Request a 2FA reconfiguration email during the login process.
 * This requires valid credentials but allows bypassing the 2FA challenge.
 */
export async function requestTwoFactorResetDuringLogin(formData: FormData) {
    const emailRaw = formData.get('email') as string;
    const email = emailRaw ? emailRaw.trim().toLowerCase() : '';
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required.' };
    }

    const ip = await getClientIp();

    // 1. Check Security State (IP Blocks, User Locks)
    const security = await getSecurityState(email, ip);
    if (security.isIpBlocked || security.isUserLocked) {
        return { error: 'Access temporarily restricted due to security policies. Please try again later.' };
    }

    try {
        // 2. Verify Credentials
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, passwordHash: true, twoFactorEnabled: true }
        });

        if (!user || !user.passwordHash) {
            await recordFailure(email, ip);
            return { error: 'Invalid email or password.' };
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            await recordFailure(email, ip);
            return { error: 'Invalid email or password.' };
        }

        if (!user.twoFactorEnabled) {
            return { error: 'Two-Factor Authentication is not enabled for this account.' };
        }

        // Credentials valid — reset failure state for this phase
        await recordSuccess(email, ip);

        // 3. Generate and Store Token
        const token = crypto.randomBytes(32).toString('hex');
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 30);

        // @ts-ignore
        await prisma.twoFactorResetToken.create({
            data: {
                email,
                token,
                expiresAt: expirationDate,
            }
        });

        // 4. Send Email
        await sendTwoFactorReconfigureEmail(email, token);

        return { success: true, message: 'Reconfiguration email sent! Please check your inbox.' };
    } catch (error) {
        console.error('[2FA] Login reset request error:', error);
        return { error: 'Failed to process 2FA reset request' };
    }
}

/**
 * Request a 2FA reconfiguration email.
 */
export async function requestTwoFactorReconfiguration() {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return { error: 'Not authenticated' };
    }

    try {
        const token = crypto.randomBytes(32).toString('hex');
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 30);

        // @ts-ignore
        await prisma.twoFactorResetToken.create({
            data: {
                email: session.user.email,
                token,
                expiresAt: expirationDate,
            }
        });

        await sendTwoFactorReconfigureEmail(session.user.email, token);

        return { success: true, message: 'Reconfiguration email sent! Please check your inbox.' };
    } catch (error) {
        console.error('[2FA] Request reconfig error:', error);
        return { error: 'Failed to send reconfiguration email' };
    }
}

/**
 * Resets 2FA using a valid reconfiguration token.
 */
export async function resetTwoFactorWithToken(token: string) {
    try {
        // @ts-ignore
        const resetToken = await prisma.twoFactorResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
            return { error: 'Invalid or expired reconfiguration token.' };
        }

        const user = await prisma.user.findUnique({
            where: { email: resetToken.email }
        });

        if (!user) {
            return { error: 'User not found.' };
        }

        // Disable 2FA and mark token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                // @ts-ignore
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null
                }
            }),
            // @ts-ignore
            prisma.twoFactorResetToken.update({
                where: { id: resetToken.id },
                data: { used: true }
            })
        ]);

        return { success: true, message: '2FA has been reset. You can now set up a new device.' };
    } catch (error) {
        console.error('[2FA] Reset with token error:', error);
        return { error: 'Failed to reset 2FA' };
    }
}


// Create OTP instance (TOTP is the default strategy)
const otp = new OTP();

/**
 * Generate a 2FA secret + QR code for the current user.
 * Does NOT enable 2FA yet — user must verify a code first.
 */
export async function generateTwoFactorSetup() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    // 1. Check IP Security
    const ip = await getClientIp();
    const security = await getSecurityState(null, ip);

    if (security.isIpPermanentBlocked) {
        return { error: 'This IP address is permanently blocked.' };
    }

    if (security.isIpBlocked) {
        const retryMinutes = security.blockedUntil ? Math.ceil((security.blockedUntil.getTime() - Date.now()) / 60000) : 4 * 60;
        return { error: `Too many requests from this IP. Please try again in ${retryMinutes} minutes.` };
    }


    try {
        // Generate a new secret
        const secret = otp.generateSecret();

        // Store encrypted secret (not yet enabled)
        await prisma.user.update({
            where: { id: session.user.id },
            // @ts-ignore
            data: { twoFactorSecret: encrypt(secret) },
        });

        // Generate otpauth URI
        const otpauthUri = otp.generateURI({
            secret,
            issuer: 'CredSecure',
            label: session.user.email,
        });

        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);

        return {
            success: true,
            qrCode: qrCodeDataUrl,
            secret, // Needed for mobile users who can't scan QR on the same device
        };
    } catch (error) {
        console.error('[2FA] Generate setup error:', error);
        return { error: 'Failed to generate 2FA setup' };
    }
}

/**
 * Verify a TOTP code and enable 2FA for the current user.
 */
export async function enableTwoFactor(code: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    const ip = await getClientIp();
    const security = await getSecurityState(null, ip);

    if (security.isIpPermanentBlocked || security.isIpBlocked) {
        return { error: 'Too many requests from this IP. Please try again later.' };
    }


    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        // @ts-ignore
        if (!user?.twoFactorSecret) {
            return { error: 'No 2FA secret found. Please generate setup first.' };
        }

        // @ts-ignore
        const secret = decrypt(user.twoFactorSecret);

        const result = await otp.verify({
            token: code,
            secret,
        });

        const isValid = result && result.valid;

        if (!isValid) {
            await recordFailure(session.user.email, ip);
            await logLoginActivity({
                email: session.user.email,
                outcome: 'FAILURE',
                category: 'MFA',
                reasonCode: 'MFA_ENABLE_INVALID_CODE',
                reasonMessage: '2FA Enrichment failed: Invalid verification code.',
                authMethod: '2FA_TOTP',
                ipAddress: ip
            });
            return { error: 'Invalid verification code. Please try again.' };
        }

        // Enable 2FA — and reset failure state
        await recordSuccess(session.user.email, ip);
        await prisma.user.update({
            where: { id: session.user.id },
            // @ts-ignore
            data: { twoFactorEnabled: true },
        });

        await logLoginActivity({
            email: session.user.email,
            outcome: 'SUCCESS',
            category: 'MFA',
            reasonCode: 'MFA_ENABLED',
            reasonMessage: 'Two-Factor Authentication enabled successfully.',
            authMethod: '2FA_TOTP',
            ipAddress: ip
        });

        return { success: true, message: 'Two-Factor Authentication enabled successfully!' };
    } catch (error) {
        console.error('[2FA] Enable error:', error);
        return { error: 'Failed to enable 2FA' };
    }
}

/**
 * Disable 2FA for the current user (requires valid code).
 */
export async function disableTwoFactor(code: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    const ip = await getClientIp();
    const security = await getSecurityState(null, ip);

    if (security.isIpPermanentBlocked || security.isIpBlocked) {
        return { error: 'Too many requests from this IP. Please try again later.' };
    }

    try {
        // Check enterprise-level mandatory 2FA policy
        const settings = await prisma.systemSettings.findFirst({
            select: { twoFactorMandatory: true },
        });
        if (settings?.twoFactorMandatory) {
            return { error: 'Two-Factor Authentication is mandatory at the enterprise level. It cannot be disabled.' };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        // @ts-ignore
        if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
            return { error: '2FA is not enabled.' };
        }

        // @ts-ignore
        const secret = decrypt(user.twoFactorSecret);

        const result = await otp.verify({
            token: code,
            secret,
        });

        const isValid = result && result.valid;

        if (!isValid) {
            await recordFailure(session.user.email, ip);
            await logLoginActivity({
                email: session.user.email,
                outcome: 'FAILURE',
                category: 'MFA',
                reasonCode: 'MFA_DISABLE_INVALID_CODE',
                reasonMessage: '2FA Disable failed: Invalid verification code.',
                authMethod: '2FA_TOTP',
                ipAddress: ip
            });
            return { error: 'Invalid verification code.' };
        }

        // Disable 2FA and clear secret
        await recordSuccess(session.user.email, ip);
        await prisma.user.update({
            where: { id: session.user.id },
            // @ts-ignore
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        await logLoginActivity({
            email: session.user.email,
            outcome: 'SUCCESS',
            category: 'MFA',
            reasonCode: 'MFA_DISABLED',
            reasonMessage: 'Two-Factor Authentication disabled.',
            authMethod: '2FA_TOTP',
            ipAddress: ip
        });

        return { success: true, message: 'Two-Factor Authentication disabled.' };
    } catch (error) {
        console.error('[2FA] Disable error:', error);
        return { error: 'Failed to disable 2FA' };
    }
}
