'use server';

import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function assignUserToGroup(
    targetUserId: string,
    groupId: string,
    scopes?: {
        categories?: string[],
        environments?: string[]
    }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        const categories = scopes?.categories?.join(',') || null;
        const environments = scopes?.environments?.join(',') || null;

        await prisma.userGroupMapping.upsert({
            where: { userId_groupId: { userId: targetUserId, groupId } },
            update: {
                scopedCategories: categories,
                scopedEnvironments: environments,
                assignedBy: session.user.id
            },
            create: {
                userId: targetUserId,
                groupId: groupId,
                scopedCategories: categories,
                scopedEnvironments: environments,
                assignedBy: session.user.id
            }
        });

        await logAudit({
            action: 'ASSIGN_GROUP',
            details: `Assigned user to group ${groupId} with scopes: Cat=[${categories || 'ALL'}], Env=[${environments || 'ALL'}]`,
            userId: session.user.id
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Failed to assign group:', error);
        return { error: 'Failed to assign group' };
    }
}

export async function removeUserFromGroup(targetUserId: string, groupId: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        await prisma.userGroupMapping.delete({
            where: { userId_groupId: { userId: targetUserId, groupId } }
        });

        await logAudit({
            action: 'REMOVE_GROUP',
            details: `Removed user from group ${groupId}`,
            userId: session.user.id
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Failed to remove group:', error);
        return { error: 'Failed to remove group' };
    }
}
