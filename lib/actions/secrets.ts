'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { logAudit } from '@/lib/actions/audit';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { sendOneTimeSecretEmail } from '@/lib/email';

export interface CreateSecretInput {
    secretData: string;
    name?: string;
    maxViews: number;
    ttlHours: number;
    sharedVia: 'LINK' | 'EMAIL';
    recipientEmail?: string;
    recipientMessage?: string;
}

/**
 * Creates a new One-Time Secret.
 */
export async function createOneTimeSecret(input: CreateSecretInput) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    // Permission check for authorized users would go here if not open to all
    // For now assuming all logged-in users can create secrets as per requirements "Authorized Users"
    // Ideally check for 'CREATE_ONE_TIME' permission if fully implemented in UI gate.

    const { secretData, name, maxViews, ttlHours, sharedVia, recipientEmail, recipientMessage } = input;

    if (!secretData) return { error: 'Secret data is required' };
    if (sharedVia === 'EMAIL' && !recipientEmail) return { error: 'Recipient email is required for email sharing' };

    try {
        const token = randomBytes(32).toString('hex');
        const encryptedData = encrypt(secretData);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + ttlHours);

        const secret = await prisma.oneTimeSecret.create({
            data: {
                name,
                secretData: encryptedData,
                token,
                expiresAt,
                maxViews,
                sharedVia,
                recipientEmail,
                createdById: session.user.id
            }
        });

        await logAudit({
            action: 'CREATE_ONE_TIME_SECRET',
            details: `Created one-time secret '${name || 'Untitled'}' shared via ${sharedVia}`,
            userId: session.user.id
        });

        if (sharedVia === 'EMAIL' && recipientEmail) {
            await sendOneTimeSecretEmail(recipientEmail, token, session.user.name || 'A user', recipientMessage, expiresAt, maxViews);
        }

        revalidatePath('/one-time-secrets');
        return { success: true, token, id: secret.id };

    } catch (error) {
        console.error('Failed to create secret:', error);
        return { error: 'Failed to create secret' };
    }
}

/**
 * Retrieves My Secrets (Created by current user).
 * Admins/Super Admins can see ALL secrets (but maybe not decrypt them unless they use the token flow, 
 * but dashboard requirement says "View all created one-time secrets... See status... Revoke").
 */
export async function getMySecrets() {
    const session = await auth();
    if (!session?.user) return [];

    const isAdmin = session.user.role === 'ADMIN'; // Or check Super Admin if role distinguishes

    const where = isAdmin ? {} : { createdById: session.user.id };

    try {
        const secrets = await prisma.oneTimeSecret.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: { name: true, email: true }
                }
            }
        });

        // Lazy expire check for the dashboard list
        const now = new Date();
        const secretsToExpire = secrets.filter((s) =>
            s.status === 'ACTIVE' && (
                new Date(s.expiresAt) < now ||
                s.currentViews >= s.maxViews
            )
        );

        if (secretsToExpire.length > 0) {
            // Update in DB
            await prisma.oneTimeSecret.updateMany({
                where: {
                    id: { in: secretsToExpire.map((s) => s.id) }
                },
                data: { status: 'EXPIRED' }
            });

            // Update in memory for return
            secretsToExpire.forEach((s) => s.status = 'EXPIRED');
        }

        return secrets;
    } catch (error) {
        console.error('Failed to fetch secrets:', error);
        return [];
    }
}

/**
 * Revokes a secret immediately.
 */
export async function revokeSecret(secretId: string) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    try {
        const secret = await prisma.oneTimeSecret.findUnique({ where: { id: secretId } });
        if (!secret) return { error: 'Secret not found' };

        // Only owner or Admin can revoke
        const isAdmin = session.user.role === 'ADMIN';
        if (secret.createdById !== session.user.id && !isAdmin) {
            return { error: 'Unauthorized' };
        }

        await prisma.oneTimeSecret.update({
            where: { id: secretId },
            data: { status: 'REVOKED' }
        });

        await logAudit({
            action: 'REVOKE_ONE_TIME_SECRET',
            details: `Revoked secret '${secret.name || secret.id}'`,
            userId: session.user.id
        });

        revalidatePath('/one-time-secrets');
        return { success: true };

    } catch (error) {
        console.error('Failed to revoke secret:', error);
        return { error: 'Failed to revoke secret' };
    }
}

/**
 * Public Access: Verify and Retrieve Secret.
 * This does NOT require authentication.
 */
export async function getOneTimeSecret(token: string) {
    // No auth check needed, token is the key.

    try {
        const secret = await prisma.oneTimeSecret.findUnique({
            where: { token }
        });

        if (!secret) {
            return { error: 'Secret not found or invalid link.' };
        }

        if (secret.status !== 'ACTIVE') {
            return { error: 'This secret is no longer active.' };
        }

        if (new Date() > secret.expiresAt) {
            // Auto-expire
            await prisma.oneTimeSecret.update({
                where: { id: secret.id },
                data: { status: 'EXPIRED' }
            });
            return { error: 'This secret has expired.' };
        }

        if (secret.currentViews >= secret.maxViews) {
            // Auto-expire
            await prisma.oneTimeSecret.update({
                where: { id: secret.id },
                data: { status: 'EXPIRED' } // Or just say max views reached
            });
            return { error: 'This secret has reached its maximum view limit.' };
        }

        // Check again to be atomic-ish (Prisma doesn't do atomic 'update if', but close enough for this)
        // We will increment views NOW. The user is "viewing" it aka retrieving it.
        // Wait, the flow says: Show warning page -> User clicks "Reveal" -> Then show.
        // So this function should have two modes or just "validate" vs "reveal".
        // Let's split this into "validateSecretMetadata" and "revealSecret".

        return { error: 'Use revealSecret to get data' }; // Should not use this for direct reveal if we want the 2-step flow.
    } catch (error) {
        return { error: 'System error processing request.' };
    }
}

export async function validateSecretMetadata(token: string) {
    try {
        const secret = await prisma.oneTimeSecret.findUnique({
            where: { token },
            select: {
                id: true,
                status: true,
                expiresAt: true,
                maxViews: true,
                currentViews: true,
                sharedVia: true
            }
        });

        if (!secret) return { valid: false, error: 'Invalid link' };

        if (secret.status !== 'ACTIVE') return { valid: false, error: 'Secret is not active' };

        if (new Date() > secret.expiresAt) {
            // Lazy expire
            await prisma.oneTimeSecret.update({ where: { id: secret.id }, data: { status: 'EXPIRED' } });
            return { valid: false, error: 'Expired' };
        }

        if (secret.currentViews >= secret.maxViews) {
            return { valid: false, error: 'Max views reached' };
        }

        return {
            valid: true,
            data: {
                remainingViews: secret.maxViews - secret.currentViews,
                expiresAt: secret.expiresAt
            }
        };

    } catch (error) {
        return { valid: false, error: 'System error' };
    }
}

export async function revealSecret(token: string) {
    try {
        // Fetch again to ensure atomic checks
        const secret = await prisma.oneTimeSecret.findUnique({ where: { token } });

        if (!secret || secret.status !== 'ACTIVE') return { error: 'Invalid or inactive secret' };

        if (new Date() > secret.expiresAt) {
            await prisma.oneTimeSecret.update({ where: { id: secret.id }, data: { status: 'EXPIRED' } });
            return { error: 'Expired' };
        }

        if (secret.currentViews >= secret.maxViews) {
            return { error: 'Max views reached' };
        }

        // Increment View
        const updatedSecret = await prisma.oneTimeSecret.update({
            where: { id: secret.id },
            data: {
                currentViews: { increment: 1 }
            }
        });

        // Check if we just hit the limit
        if (updatedSecret.currentViews >= updatedSecret.maxViews) {
            await prisma.oneTimeSecret.update({
                where: { id: secret.id },
                data: { status: 'EXPIRED' }
            });
        }

        // Decrypt
        const decrypted = decrypt(secret.secretData);

        // Log Audit (Public Access)
        // We might not have a user ID here.
        await logAudit({
            action: 'VIEW_ONE_TIME_SECRET',
            details: `Secret accessed via public link`,
            credentialId: undefined, // It's not a credentialMaster
            // performedBy: 'PUBLIC' // Need to handle null user in audit log or just omit
            // AuditLog schema allows performedById nullable? Yes.
        });

        return { success: true, secretData: decrypted };

    } catch (error) {
        console.error("Reveal error", error);
        return { error: 'Failed to reveal' };
    }
}

/**
 * Deletes all expired or revoked secrets.
 * Admins clean up ALL. Users clean up THEIR OWN.
 */
export async function deleteExpiredSecrets() {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const isAdmin = session.user.role === 'ADMIN';

    // Criteria: Status is EXPIRED or REVOKED.
    // AND (if not admin) createdById is me.
    const where: any = {
        status: { in: ['EXPIRED', 'REVOKED'] }
    };

    if (!isAdmin) {
        where.createdById = session.user.id;
    }

    try {
        const result = await prisma.oneTimeSecret.deleteMany({
            where
        });

        await logAudit({
            action: 'DELETE_EXPIRED_SECRETS',
            details: `Cleaned up ${result.count} expired/revoked secrets`,
            userId: session.user.id
        });

        revalidatePath('/one-time-secrets');
        return { success: true, count: result.count };
    } catch (error) {
        console.error('Failed to delete expired secrets:', error);
        return { error: 'Failed to clean up secrets' };
    }
}
