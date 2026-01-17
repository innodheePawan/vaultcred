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

export async function createInvite(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const email = formData.get('email') as string;
    const role = formData.get('role') as string || 'USER';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return { error: 'User already exists' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
        const invite = await prisma.invite.create({
            data: {
                email,
                role,
                token,
                expiresAt,
                createdById: session.user.id,
            },
        });

        // Upsert user as INVITED
        await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                role,
                status: 'INVITED',
            },
        });

        await logAudit({
            action: 'CREATE_INVITE',
            details: `Invited ${email} as ${role}`
        });

        return { success: true, token: invite.token };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to create invite' };
    }
}

export async function registerUser(token: string, formData: FormData) {
    const invite = await prisma.invite.findUnique({
        where: { token },
        include: { createdBy: true }
    });

    if (!invite) return { error: 'Invalid token' };
    if (invite.acceptedAt) return { error: 'Invite already used' };
    if (invite.expiresAt < new Date()) return { error: 'Invite expired' };

    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    if (!password || password.length < 6) return { error: 'Password too weak' };

    const hashedPassword = await hashPassword(password);

    try {
        await prisma.$transaction([
            prisma.user.update({
                where: { email: invite.email },
                data: {
                    name,
                    passwordHash: hashedPassword,
                    status: 'ACTIVE',
                    // emailVerified: new Date(), // Field doesn't exist in our schema
                },
            }),
            prisma.invite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() },
            }),
        ]);

        await logAudit({
            action: 'REGISTER_USER',
            details: `User registered: ${name} (${invite.email})`
        });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: 'Registration failed' };
    }
}
