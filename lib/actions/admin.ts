'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createInvite, validateInvite, acceptInvite } from '@/lib/iam/invites';
import { getUserAccessContext, canAccess } from '@/lib/iam/permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearRateLimit } from '@/lib/rate-limit';

export async function getUsersAndInvites() {
    const session = await auth();
    // Allow if System Admin OR has ADMIN permission
    const ctx = session?.user?.id ? await getUserAccessContext(session.user.id) : null;
    const hasAdminAccess = ctx ? canAccess(ctx, null, null, 'ADMIN') : false;

    if (session?.user?.role !== 'ADMIN' && !hasAdminAccess) return { users: [], invites: [], isSystemAdmin: false, canInvite: false };

    const users = await prisma.user.findMany({
        where: { status: { not: 'INVITED' } },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            profileImage: true,
            createdAt: true,
            lastLogin: true,
            twoFactorEnabled: true,
            // External Vendor Fields
            isExternal: true,
            vendorName: true,
            externalAccessType: true,
            accessExpiresAt: true,
            allowedCategories: true,
            allowedEnvironments: true,
            allowedCredentialIds: true,
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
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            userGroups: { include: { group: true } }
        }
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

export async function getAllCredentialsSummary() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const ctx = await getUserAccessContext(session.user.id);
    const hasAdminAccess = canAccess(ctx, null, null, 'ADMIN');

    if (session.user.role !== 'ADMIN' && !hasAdminAccess) return [];

    // Only fetch necessary fields for the dropdown
    return prisma.credentialMaster.findMany({
        where: { isPersonal: false },
        select: {
            id: true,
            name: true,
            type: true,
            category: true,
            environment: true
        },
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

    const isExternal = formData.get('isExternal') === 'on';
    const vendorName = formData.get('vendorName') as string;
    const externalAccessType = formData.get('externalAccessType') as string;
    const accessExpiresAtRaw = formData.get('accessExpiresAt') as string;
    const accessExpiresAt = accessExpiresAtRaw ? new Date(accessExpiresAtRaw) : null;
    const credentialIds = formData.getAll('credentialIds') as string[];

    if (isExternal) {
        if (!vendorName) return { error: 'Vendor Name is required for external access' };
        if (!accessExpiresAt) return { error: 'Expiry Date is required for external access' };

        // If external, they must have EITHER Scope (Cat/Env) OR specific Credentials
        const hasScope = scopedCats || scopedEnvs;
        const hasSpecificCreds = credentialIds.length > 0;

        if (!hasScope && !hasSpecificCreds) {
            return { error: 'External vendors require either specific scope access (Category, Environment) or specific Credential selection.' };
        }
    }

    try {
        const invite = await createInvite(
            email,
            session.user.id!,
            targetGroupIds,
            role,
            scopedCats,
            scopedEnvs,
            isExternal,
            externalAccessType,
            accessExpiresAt,
            vendorName,
            credentialIds
        );

        const { isSmtpConfigured } = await import('@/lib/email');
        const smtpOk = await isSmtpConfigured();

        revalidatePath('/dashboard/admin/users');
        revalidatePath('/admin/users');

        if (!smtpOk) {
            return {
                success: true,
                warning: true,
                message: `Invite generated for ${email}, but SMTP is not configured. The user will NOT receive an email.`,
                token: invite.token
            };
        }

        if (!(invite as any).emailSent) {
            return {
                success: true,
                warning: true,
                message: `Invite generated, but the email failed to send. Check your SMTP settings.`,
                token: invite.token
            };
        }

        return { success: true, message: `Invite sent successfully to ${email}` };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function resendInvite(inviteId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const ctx = await getUserAccessContext(session.user.id);
    const hasAdminPermission = canAccess(ctx, null, null, 'ADMIN');

    if (session.user.role !== 'ADMIN' && !hasAdminPermission) {
        return { error: 'Unauthorized' };
    }

    try {
        const invite = await prisma.invite.findUnique({
            where: { id: inviteId }
        });

        if (!invite) return { error: 'Invite not found' };
        if (invite.accepted) return { error: 'Invite already accepted' };

        // Send Email
        const { isSmtpConfigured } = await import('@/lib/email');
        const smtpOk = await isSmtpConfigured();

        if (!smtpOk) {
            return {
                success: true,
                warning: true,
                message: `Invite generated for ${invite.email}, but SMTP is not configured. The user will NOT receive an email automatically.`
            };
        }

        // Refresh expiration date
        const newExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now
        await prisma.invite.update({
            where: { id: inviteId },
            data: { expiresAt: newExpiresAt }
        });

        await import('@/lib/email').then(mod =>
            mod.sendInviteEmail(invite.email, invite.token, session.user.name || 'Admin')
        );

        return { success: true, message: `Invite resent to ${invite.email}` };
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

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { isExternal: true, role: true }
        });

        if (!existingUser) return { error: 'User not found' };

        let updateData: any = { status };
        let groupsToAssign: { groupId: string; categories: string | null; environments: string | null }[] = [];

        if (existingUser.isExternal) {
            // EXTERNAL VENDOR UPDATE
            const vendorName = formData.get('vendorName') as string;
            const accessExpiresAtRaw = formData.get('accessExpiresAt') as string;
            const externalAccessType = formData.get('externalAccessType') as string;

            // For external, scopes are stored on the User model directly as per schema
            const allowedCategories = formData.get('scopedCategories') as string;
            const allowedEnvironments = formData.get('scopedEnvironments') as string;
            const allowedCredentialIds = formData.getAll('credentialIds') as string[];

            if (!vendorName) return { error: 'Vendor Name is required.' };
            if (!accessExpiresAtRaw) return { error: 'Expiry Date is required.' };

            updateData = {
                ...updateData,
                vendorName,
                accessExpiresAt: new Date(accessExpiresAtRaw),
                externalAccessType,
                allowedCategories: allowedCategories || null,
                allowedEnvironments: allowedEnvironments || null,
                allowedCredentialIds: allowedCredentialIds.length > 0 ? allowedCredentialIds.join(',') : null
            };

            // External users stay as USER role
            updateData.role = 'USER';

        } else {
            // INTERNAL USER UPDATE
            const systemRole = formData.get('systemRole') as string; // 'SUPER_ADMIN' | 'GROUP'
            let newRole = 'USER';

            if (systemRole === 'SUPER_ADMIN') {
                newRole = 'ADMIN';
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

            updateData.role = newRole;

            // Safety check: Cannot deactivate/demote last Super Admin
            if ((newRole !== 'ADMIN' || status !== 'ACTIVE') && existingUser.role === 'ADMIN') {
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
        }

        await prisma.$transaction(async (tx) => {
            // Update User details
            await tx.user.update({
                where: { id: userId },
                data: updateData
            });

            // Update Groups (Wipe and Recreate) - ONLY IF INTERNAL
            // External users don't use the UserGroupMapping table for scopes in this design (stored on User model)
            // But we should wipe any existing group mappings if they were somehow present, to be clean.
            // OR if we are switching from Internal -> External (not supported yet)

            if (!existingUser.isExternal) {
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
            }
        });

        // Clear login rate limit when re-enabling a user
        if (status === 'ACTIVE') {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
            if (user?.email) {
                clearRateLimit(`login:${user.email}`);
            }
        }

        revalidatePath('/dashboard/admin/users');
        return { success: true, message: 'User updated successfully' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        // Safety check: Cannot delete the last remaining Super Admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, status: true }
        });

        if (user?.role === 'ADMIN') {
            const activeAdminCount = await prisma.user.count({
                where: {
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    id: { not: userId }
                }
            });

            if (activeAdminCount === 0) {
                return { error: 'Action Denied: You cannot delete the last remaining Super Admin.' };
            }
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        revalidatePath('/settings/database');
        return { success: true, message: 'User deleted successfully' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteInvite(inviteId: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        await prisma.invite.delete({
            where: { id: inviteId }
        });

        revalidatePath('/settings/database');
        return { success: true, message: 'Invite deleted successfully' };
    } catch (error: any) {
        return { error: error.message };
    }
}
