'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';
import { revalidatePath } from 'next/cache';

export async function searchUsers(query: string) {
    const session = await auth();
    if (!session?.user) return [];

    if (!query || query.length < 2) return [];

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { email: { contains: query } }
            ],
            AND: [
                { id: { not: session.user.id } },
                { status: 'ACTIVE' }
            ]
        },
        take: 5,
        select: { id: true, name: true, email: true }
    });

    return users;
}

export async function shareCredential(credentialId: string, userId: string) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    try {
        const credential = await prisma.credentialMaster.findUnique({ where: { id: credentialId } });
        if (!credential) return { error: 'Credential not found' };

        // Only owner or admin can share
        // Note: owner is createdById in new schema
        if (credential.createdById !== session.user.id && session.user.role !== 'ADMIN') {
            return { error: 'Only the owner can share' };
        }

        // Check if already shared
        const existingShare = await prisma.credentialAccess.findUnique({
            where: {
                credentialId_userId: {
                    credentialId,
                    userId
                }
            }
        });

        if (existingShare) return { error: 'Already shared with this user' };

        await prisma.credentialAccess.create({
            data: {
                credentialId,
                userId,
                permission: 'READ' // Default permission
            }
        });

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });

        await logAudit({
            action: 'UPDATE_CREDENTIAL',
            credentialId,
            details: `Shared credential with ${targetUser?.email}`,
            performedById: session.user.id
        });

        revalidatePath(`/credentials/${credentialId}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to share', error);
        return { error: 'Failed to share credential' };
    }
}

export async function unshareCredential(credentialId: string, userId: string) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    try {
        const credential = await prisma.credentialMaster.findUnique({ where: { id: credentialId } });
        if (!credential) return { error: 'Credential not found' };

        if (credential.createdById !== session.user.id && session.user.role !== 'ADMIN') {
            return { error: 'Only the owner can unshare' };
        }

        await prisma.credentialAccess.delete({
            where: {
                credentialId_userId: {
                    credentialId,
                    userId
                }
            }
        });

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });

        await logAudit({
            action: 'UPDATE_CREDENTIAL',
            credentialId,
            details: `Revoked share from ${targetUser?.email}`,
            performedById: session.user.id
        });

        revalidatePath(`/credentials/${credentialId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to unshare', error);
        return { error: 'Failed to unshare' };
    }
}

