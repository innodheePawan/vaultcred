'use server';

import { signIn, auth } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils/password';
// import { crypto } from 'next/dist/server/server-utils'; // Removed invalid import
import { randomBytes } from 'crypto';
import { logAudit } from '@/lib/actions/audit';

export async function authenticate(
    prevState: any,
    formData: FormData,
) {
    try {
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirect: false,
        });

        // If redirect: false works and doesn't throw, we reach here.
        await logAudit({
            action: 'LOGIN',
            details: `Login successful for ${formData.get('email')}`
        });

        return { success: true };

    } catch (error) {
        if (error instanceof AuthError) {
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
            await logAudit({
                action: 'LOGIN',
                details: `Login successful for ${formData.get('email')}`
            });
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

    if (!name || !password || password.length < 6) {
        return { error: 'Invalid name or password (min 6 chars)' };
    }

    try {
        await acceptInvite(token, name, password);

        await logAudit({
            action: 'REGISTER_USER',
            details: `User registered via invite token`
        });

        return { success: true };
    } catch (error: any) {
        console.error("Registration failed:", error);
        return { error: error.message || 'Registration failed' };
    }
}
