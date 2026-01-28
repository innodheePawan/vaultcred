'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createInvite, validateInvite, acceptInvite } from '@/lib/iam/invites';
import { getUserAccessContext, canAccess } from '@/lib/iam/permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getUsersAndInvites() {
    const session = await auth();
    // Allow if System Admin OR has ADMIN permission
    const ctx = session?.user?.id ? await getUserAccessContext(session.user.id) : null;
    const hasAdminAccess = ctx ? canAccess(ctx, null, null, 'ADMIN') : false;

    if (session?.user?.role !== 'ADMIN' && !hasAdminAccess) return { users: [], invites: [], isSystemAdmin: false, canInvite: false };

    const users = await prisma.user.findMany({
        where: { status: { not: 'INVITED' } },
        include: {
            userGroups: {
                include: { group: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    const invites = await prisma.invite.findMany({
        where: { accepted: false },
        orderBy: { createdAt: 'desc' }
    });

    const currentUser = await prisma.user.findUnique({
        where: { id: session!.user!.id },
        include: { userGroups: { include: { group: true } } }
    });

    // System Admin = Full Global Admin (Role=ADMIN implies Super Admin currently, or specific Group)
    const isSystemAdmin = currentUser?.role === 'ADMIN' || currentUser?.userGroups.some(ug => ug.group.name === 'Administrator') || false;

    // Can Invite = System Admin OR Scoped Admin
    const canInvite = isSystemAdmin || hasAdminAccess;

    return { users, invites, isSystemAdmin, canInvite };
}

export async function getAllGroups() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const ctx = await getUserAccessContext(session.user.id);
    const hasAdminAccess = canAccess(ctx, null, null, 'ADMIN');

    if (session.user.role !== 'ADMIN' && !hasAdminAccess) return [];

    return prisma.userGroup.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function inviteUser(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    // Check Auth: Admin Role OR Admin Permission
    const ctx = await getUserAccessContext(session.user.id);
    const hasAdminPermission = canAccess(ctx, null, null, 'ADMIN');

    if (session.user.role !== 'ADMIN' && !hasAdminPermission) {
        return { error: 'Unauthorized' };
    }

    const email = formData.get('email') as string;

    // New Logic: Handle System Role & Scopes
    const systemRole = formData.get('systemRole') as string; // 'SUPER_ADMIN' | 'GROUP'

    let role = 'USER';
    let targetGroupIds: string[] = [];
    let scopedCats: string | null = null;
    let scopedEnvs: string | null = null;

    if (systemRole === 'SUPER_ADMIN') {
        role = 'ADMIN';
    } else {
        // Group Based
        // The form field for group select is named 'groups'
        const gIds = formData.getAll('groups') as string[];
        if (gIds.length > 0) targetGroupIds = gIds;

        const cat = formData.get('scopedCategories') as string;
        if (cat) scopedCats = cat;

        const env = formData.get('scopedEnvironments') as string;
        if (env) scopedEnvs = env;
    }

    if (!email) return { error: 'Email is required' };

    try {
        const invite = await createInvite(email, session.user.id!, targetGroupIds, role, scopedCats, scopedEnvs);
        revalidatePath('/dashboard/admin/users');
        revalidatePath('/admin/users');
        return { success: true, message: `Invite sent to ${email}`, token: invite.token };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateUser(userId: string, formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    const status = formData.get('status') as string;
    const groupIds = formData.getAll('groups') as string[];

    try {
        // Logic Update for Scoped Roles
        // Check for 'systemRole' in formData. 
        // If 'SUPER_ADMIN' -> role = ADMIN, clear groups.
        // If 'GROUP' -> role = USER, assign single group with scopes.

        const systemRole = formData.get('systemRole') as string; // 'SUPER_ADMIN' | 'GROUP'
        // Fallback for legacy calls or missing field? Default to GROUP logic if groupId present.

        let newRole = 'USER';
        let groupsToAssign: { groupId: string; categories: string | null; environments: string | null }[] = [];

        if (systemRole === 'SUPER_ADMIN') {
            newRole = 'ADMIN';
            // No groups needed for Super Admin as per strictly "Role" based access
            // But maybe we want to track them? For now, following plan: Super Admin has global access via role.
        } else {
            // Group Based
            const groupId = formData.get('groupId') as string;
            const categories = formData.get('scopedCategories') as string;
            const environments = formData.get('scopedEnvironments') as string;

            if (groupId) {
                groupsToAssign.push({
                    groupId,
                    categories: categories || null,
                    environments: environments || null
                });
            }
        }

        if (newRole !== 'ADMIN' || status !== 'ACTIVE') {
            // Check if there are ANY OTHER active admins
            const activeAdminCount = await prisma.user.count({
                where: {
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    id: { not: userId }
                }
            });

            if (activeAdminCount === 0) {
                return { error: 'Action Denied: You cannot deactivate or demote the last remaining Super Admin.' };
            }
        }

        await prisma.$transaction(async (tx) => {
            // Update User details
            await tx.user.update({
                where: { id: userId },
                data: { role: newRole, status }
            });

            // Update Groups (Wipe and Recreate)
            await tx.userGroupMapping.deleteMany({ where: { userId } });

            if (groupsToAssign.length > 0) {
                await tx.userGroupMapping.createMany({
                    data: groupsToAssign.map(g => ({
                        userId,
                        groupId: g.groupId,
                        scopedCategories: g.categories,
                        scopedEnvironments: g.environments,
                        assignedBy: session.user.id!
                    }))
                });
            }
        });

        revalidatePath('/dashboard/admin/users');
        return { success: true, message: 'User updated successfully' };
    } catch (error: any) {
        return { error: error.message };
    }
}
