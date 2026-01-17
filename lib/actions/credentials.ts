'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { logAudit } from '@/lib/actions/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CredentialSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['PASSWORD', 'API_KEY', 'SSH', 'OTHER']),
    username: z.string().optional(),
    password: z.string().optional(),
    key: z.string().optional(),
    notes: z.string().optional(),
    folder: z.string().optional(),
});

export type CredentialData = {
    username?: string;
    password?: string;
    key?: string;
    notes?: string;
    [key: string]: any;
};

export async function createCredential(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: 'Unauthorized' };
    }

    const rawData = {
        name: formData.get('name') as string,
        type: formData.get('type') as string,
        username: formData.get('username') as string,
        password: formData.get('password') as string,
        key: formData.get('key') as string,
        notes: formData.get('notes') as string,
        folder: formData.get('folder') as string,
    };

    // Basic validation (can be enhanced)
    if (!rawData.name || !rawData.type) {
        return { error: 'Name and Type are required' };
    }

    // Construct the data object to be encrypted
    const secretData: CredentialData = {};
    if (rawData.username) secretData.username = rawData.username;
    if (rawData.password) secretData.password = rawData.password;
    if (rawData.key) secretData.key = rawData.key;
    if (rawData.notes) secretData.notes = rawData.notes;

    try {
        const encryptedData = encrypt(JSON.stringify(secretData));

        const newCredential = await prisma.credential.create({
            data: {
                name: rawData.name,
                type: rawData.type,
                encryptedData,
                ownerId: session.user.id,
                folder: rawData.folder || null,
            },
        });

        await logAudit({
            action: 'CREATE_CREDENTIAL',
            credentialId: newCredential.id,
            details: `Created credential '${newCredential.name}' of type ${newCredential.type}`
        });

        revalidatePath('/credentials');
        return { success: true };
    } catch (error) {
        console.error('Failed to create credential:', error);
        return { error: 'Failed to create credential' };
    }
}

export async function getCredentials(query?: string) {
    const session = await auth();
    if (!session?.user) return [];

    const credentials = await prisma.credential.findMany({
        where: {
            AND: [
                query ? {
                    OR: [
                        { name: { contains: query } },
                        // { type: { contains: query } } // Type is enum, might crash if query not match
                    ]
                } : {},
                {
                    OR: [
                        { ownerId: session.user.id },
                        {
                            shares: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                }
            ]
        },
        orderBy: { updatedAt: 'desc' },
        include: {
            owner: { select: { name: true, email: true } }
        }
    });

    return credentials;
}

export async function getCredentialById(id: string) {
    const session = await auth();
    if (!session?.user) return null;

    const credential = await prisma.credential.findUnique({
        where: { id },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            shares: {
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            }
        }
    });

    if (!credential) return null;

    // Check permissions
    const isOwner = credential.ownerId === session.user.id;
    const isShared = credential.shares.some((s: any) => s.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isShared && !isAdmin) return null;

    await logAudit({
        action: 'VIEW_CREDENTIAL',
        credentialId: credential.id,
        details: `Viewed credential '${credential.name}'`
    });

    // Decrypt data
    let decryptedData = {};
    try {
        decryptedData = JSON.parse(decrypt(credential.encryptedData));
    } catch (e) {
        console.error("Failed to decrypt", e);
        decryptedData = { error: "Decryption failed" };
    }

    return {
        ...credential,
        ...decryptedData as CredentialData
    };
}

export async function deleteCredential(id: string) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    try {
        const credential = await prisma.credential.findUnique({ where: { id } });
        if (!credential) return { error: 'Not found' };

        if (credential.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
            return { error: 'Unauthorized' };
        }

        await prisma.credential.delete({ where: { id } });

        await logAudit({
            action: 'DELETE_CREDENTIAL',
            credentialId: id,
            details: `Deleted credential '${credential.name}'`
        });
        revalidatePath('/credentials');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete", error);

        return { error: 'Failed to delete' };
    }
}

export async function updateCredential(id: string, prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const rawData = {
        name: formData.get('name') as string,
        username: formData.get('username') as string,
        password: formData.get('password') as string,
        key: formData.get('key') as string,
        notes: formData.get('notes') as string,
    };

    if (!rawData.name) {
        return { error: 'Name is required' };
    }

    try {
        const credential = await prisma.credential.findUnique({ where: { id } });
        if (!credential) return { error: 'Not found' };

        if (credential.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
            return { error: 'Unauthorized' };
        }

        // Decrypt existing to merge
        let secretData: CredentialData = {};
        try {
            secretData = JSON.parse(decrypt(credential.encryptedData));
        } catch (e) {
            console.error("Decryption failed during update", e);
            // If decryption fails, we might just overwrite with new data if provided, or error?
            // Safer to error, but if they want to reset it... let's assume we proceed with empty if failed.
        }

        // Update logic: if field is provided (non-empty) or if it's explicitly cleared? 
        // Form sends empty string for untouched password/key. 
        // We will assume empty string means "no change" for secrets.
        // For non-secrets (username, notes), empty string might mean "delete content".

        // For simplicity:
        // Username/Notes: Always update (allow clear).
        // Password/Key: Update only if not empty.

        if (rawData.username !== null) secretData.username = rawData.username;
        if (rawData.notes !== null) secretData.notes = rawData.notes;

        if (rawData.password && rawData.password.trim() !== '') {
            secretData.password = rawData.password;
        }
        if (rawData.key && rawData.key.trim() !== '') {
            secretData.key = rawData.key;
        }

        const encryptedData = encrypt(JSON.stringify(secretData));

        await prisma.credential.update({
            where: { id },
            data: {
                name: rawData.name,
                encryptedData,
                updatedAt: new Date(),
            }
        });

        await logAudit({
            action: 'UPDATE_CREDENTIAL',
            credentialId: id,
            details: `Updated credential '${rawData.name}'`
        });

        revalidatePath('/credentials');
        revalidatePath(`/credentials/${id}`);
        return { success: true };

    } catch (error) {
        console.error("Failed to update", error);
        return { error: 'Failed to update credential' };
    }
}
