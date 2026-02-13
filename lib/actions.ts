'use server';

import { signIn, auth } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils/password';
import { randomBytes } from 'crypto';
import { logAudit } from '@/lib/actions/audit';
import { getSecurityState, recordFailure, recordSuccess } from '@/lib/security';
import { headers } from 'next/headers';

export async function authenticate(
    prevState: any,
    formData: FormData,
) {
    const emailRaw = formData.get('email') as string;
    const email = emailRaw ? emailRaw.trim().toLowerCase() : '';

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';

    // 1. Check Security State (IP Blocks, User Locks)
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
        return { error: 'Security challenge required. Please refresh and complete the verification.', requiresCaptcha: true };
    }


    try {
        await signIn('credentials', {
            email,
            password: formData.get('password'),
            code: formData.get('code') || undefined,
            redirect: false,
        });

        // If redirect: false works and doesn't throw, we reach here.
        // Fetch session to determine role for redirection
        const session = await auth();

        // Successful login — reset failure state
        await recordSuccess(email, ip);

        return { success: true, role: session?.user?.role, userId: session?.user?.id };

    } catch (error) {
        if (error instanceof AuthError) {
            await recordFailure(email, ip);
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Invalid credentials.' };
                default:
                    return { error: 'Something went wrong.' };
            }
        }

        // If it's a redirect error (successful login that tried to redirect),
        // we log audit and return success to let client handle navigation.
        // We can identify redirect errors implicitly by them NOT being AuthErrors here,
        // or explicitly. For now, assuming non-AuthError here is likely success/redirect 
        // if we didn't use redirect:false or if it threw anyway.
        // BUT, since we used redirect: false, straightforward success should fall through `try`.
        // If `signIn` throws even with redirect: false (some adapters), we handle it here.

        // Important: If it IS a redirect error, we still want to log audit.
        // But verifying strictly is hard without internal imports.
        // Let's assume if it's NOT an AuthError, it might be a system error OR redirect.
        // However, standard `signIn` with `redirect:false` shouldn't throw redirect.

        // If we really want to be safe, we rely on the fall-through above.
        // The previous code had `throw error` which propagated the redirect.
        // Use `throw error` only if it's not a redirect we want to suppress?

        // Actually, just throwing error creates the sidebar issue because client follows redirect 
        // without refreshing layout.
        // So we WANT to return success.

        // Let's verify if it's a redirect-like error?
        // NEXT_REDIRECT is the digest.
        const isRedirect = (error as any).digest?.startsWith('NEXT_REDIRECT') ||
            (error as any).message === 'NEXT_REDIRECT';

        if (isRedirect) {
            // Successful login that triggered redirect
            await recordSuccess(email, ip);
            return { success: true };
        }

        throw error;
    }
}

import { acceptInvite } from '@/lib/iam/invites';

// ... (authenticate remains same)

export async function registerUser(token: string, formData: FormData) {
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';

    // 1. Check Security State (IP Blocks)
    const security = await getSecurityState(null, ip);

    if (security.isIpPermanentBlocked) {
        return { error: 'This IP address is permanently blocked.' };
    }

    if (security.isIpBlocked) {
        const retryMinutes = security.blockedUntil ? Math.ceil((security.blockedUntil.getTime() - Date.now()) / 60000) : 4 * 60;
        return { error: `Too many attempts from this IP. Please try again in ${retryMinutes} minutes.` };
    }

    const isCaptchaVerified = formData.get('captcha_verified') === 'true';
    if (security.requiresCaptcha && !isCaptchaVerified) {
        return { error: 'Security challenge required.', requiresCaptcha: true };
    }

    if (!name || !password || password.length < 6) {
        await recordFailure(null, ip);
        return { error: 'Invalid name or password (min 6 chars)' };
    }

    try {
        await acceptInvite(token, name, password);

        await logAudit({
            action: 'REGISTER_USER',
            details: `User registered via invite token`
        });

        await recordSuccess(null, ip);
        return { success: true };
    } catch (error: any) {
        await recordFailure(null, ip);
        console.error("Registration failed:", error);
        return { error: error.message || 'Registration failed' };
    }
}
