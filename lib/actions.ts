'use server';

import { signIn, auth } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils/password';
// import { crypto } from 'next/dist/server/server-utils'; // Removed invalid import
import { randomBytes } from 'crypto';
import { logAudit } from '@/lib/actions/audit';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {


        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirect: false,
        });



        // Log Audit after successful sign in? No, signIn throws specific error on failure or redirects.
        // If redirect: false, we continue here.

        await logAudit({
            action: 'LOGIN',
            details: `Login successful for ${formData.get('email')}`
        });

        // Return nothing or success state? Login page handles redirect or error.
        // If we are here, it's a success (if redirect:false didn't throw).
        // BUT signIn usually redirects unless specific config.

        return undefined;

    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
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
