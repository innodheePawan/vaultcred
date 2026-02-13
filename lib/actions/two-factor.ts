'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { OTP } from 'otplib';
import QRCode from 'qrcode';
import { headers } from 'next/headers';
import { getSecurityState, recordFailure, recordSuccess } from '@/lib/security';
import { logAudit } from '@/lib/actions/audit';


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
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
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
            // @ts-ignore - Prisma types may be stale until regenerated
            data: { twoFactorSecret: encrypt(secret) },
        });

        // Generate otpauth URI
        const otpauthUri = otp.generateURI({
            secret,
            issuer: 'VaultSecure',
            label: session.user.email,
        });

        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);

        return {
            success: true,
            qrCode: qrCodeDataUrl,
            secret, // Show to user for manual entry
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

    // 1. Check IP Security
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const security = await getSecurityState(null, ip);

    if (security.isIpPermanentBlocked || security.isIpBlocked) {
        return { error: 'Too many requests from this IP. Please try again later.' };
    }


    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        // @ts-ignore - Prisma types may be stale
        if (!user?.twoFactorSecret) {
            return { error: 'No 2FA secret found. Please generate setup first.' };
        }

        // @ts-ignore
        const secret = decrypt(user.twoFactorSecret);

        // Use class verify method
        const result = await otp.verify({
            token: code,
            secret,
        });

        const isValid = result && result.valid;

        if (!isValid) {
            await recordFailure(session.user.email, ip);
            return { error: 'Invalid verification code. Please try again.' };
        }

        // Enable 2FA — and reset failure state
        await recordSuccess(session.user.email, ip);
        await prisma.user.update({
            where: { id: session.user.id },
            // @ts-ignore
            data: { twoFactorEnabled: true },
        });

        await logAudit({
            action: 'SETUP_2FA',
            details: 'Two-Factor Authentication enabled successfully',
            userId: session.user.id
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

    try {
        // 1. Check IP Security
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        const security = await getSecurityState(null, ip);

        if (security.isIpPermanentBlocked || security.isIpBlocked) {
            return { error: 'Too many requests from this IP. Please try again later.' };
        }

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

        await logAudit({
            action: 'DISABLE_2FA',
            details: 'Two-Factor Authentication was disabled',
            userId: session.user.id
        });

        return { success: true, message: 'Two-Factor Authentication disabled.' };
    } catch (error) {
        console.error('[2FA] Disable error:', error);
        return { error: 'Failed to disable 2FA' };
    }
}
