'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createInvite, validateInvite, acceptInvite } from '@/lib/iam/invites';
import { getUserAccessContext, canAccess } from '@/lib/iam/permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearRateLimit } from '@/lib/rate-limit';

export async function getUsersAndInvites(page = 1, limit = 10) {
    const session = await auth();
    // Allow if System Admin OR has ADMIN permission
    const ctx = session?.user?.id ? await getUserAccessContext(session.user.id, session.user) : null;
    const hasAdminAccess = ctx ? canAccess(ctx, 'ADMIN_USERS_GROUPS', 'VIEW') : false;

    if (session?.user?.role !== 'ADMIN' && !hasAdminAccess) return { users: { data: [], total: 0, page: 1, totalPages: 0 }, invites: [], isSystemAdmin: false, canInvite: false };

    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
            where: { status: { notIn: ['INVITED', 'DELETED'] } },
            skip,
            take: limit,
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
    }),
    prisma.user.count({ where: { status: { notIn: ['INVITED', 'DELETED'] } } })
    ]);

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

    // System Admin = Full Global Admin
    const isSystemAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.userGroups.some(ug => ug.group.name === 'Administrator') || false;

    // Can Invite = System Admin OR Scoped Admin
    const canInvite = isSystemAdmin || hasAdminAccess;

    return { 
        users: {
            data: users,
            total: totalUsers,
            page,
            totalPages: Math.ceil(totalUsers / limit)
        }, 
        invites, 
        isSystemAdmin, 
        canInvite,
        currentUserRole: currentUser?.role
    };
}

export async function getAllGroups() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const ctx = await getUserAccessContext(session.user.id, session.user);
    const hasAdminAccess = canAccess(ctx, 'ADMIN_USERS_GROUPS', 'VIEW');

    if (session.user.role !== 'ADMIN' && !hasAdminAccess) return [];

    return prisma.userGroup.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function getAllCredentialsSummary() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const ctx = await getUserAccessContext(session.user.id, session.user);
    const hasAdminAccess = canAccess(ctx, 'ADMIN_USERS_GROUPS', 'VIEW');

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

    const { getUserAccessContext, canAccess } = await import('@/lib/iam/permissions');
    const ctx = await getUserAccessContext(session.user.id, session.user, true); // forceFresh for critical security
    const hasAdminPermission = canAccess(ctx, 'ADMIN_USERS_GROUPS', 'EDIT');

    if (!hasAdminPermission) {
        return { error: 'Unauthorized' };
    }

    const email = formData.get('email') as string;

    // New Logic: Handle System Role & Scopes
    const systemRole = formData.get('systemRole') as string; // 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'AUDITOR' | 'VIEWER'

    let role = systemRole || 'USER';
    let targetGroupIds: string[] = [];
    let scopedCats: string | null = null;
    let scopedEnvs: string | null = null;

    const roleToGroupName: Record<string, string> = {
        'SUPER_ADMIN': 'Super Admin',
        'ADMIN': 'Scoped Admin',
        'SCOPED_ADMIN': 'Scoped Admin',
        'USER': 'User',
        'AUDITOR': 'Auditor',
        'VIEWER': 'Viewer'
    };

    const targetGroupName = roleToGroupName[role] || 'User';
    const targetGroup = await prisma.userGroup.findUnique({
        where: { name: targetGroupName }
    });

    if (targetGroup) {
        targetGroupIds.push(targetGroup.id);
    }

    if (role !== 'SUPER_ADMIN') {
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

    const { getUserAccessContext, canAccess } = await import('@/lib/iam/permissions');
    const ctx = await getUserAccessContext(session.user.id, session.user, true);
    const hasAdminPermission = canAccess(ctx, 'ADMIN_USERS_GROUPS', 'EDIT');

    if (!hasAdminPermission) {
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
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const { getUserAccessContext, canAccess } = await import('@/lib/iam/permissions');
    const ctx = await getUserAccessContext(session.user.id, session.user, true);
    if (!canAccess(ctx, 'ADMIN_USERS_GROUPS', 'EDIT')) {
        return { error: 'Unauthorized' };
    }

    if (userId === session.user.id) {
        return { error: 'Action Denied: You cannot modify your own profile settings from this panel.' };
    }

    const status = formData.get('status') as string;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { isExternal: true, role: true, status: true }
        });

        if (!existingUser) return { error: 'User not found' };

        // Role hierarchy validation: Only SUPER_ADMIN can edit SUPER_ADMIN
        if (existingUser.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return { error: 'Unauthorized: Only Super Admins can manage Super Admin users.' };
        }

        // Target user scope validation for Scoped Admins
        if (session.user.role !== 'SUPER_ADMIN') {
            const targetCtx = await getUserAccessContext(userId, null, false);
            
            // If target has full category scope and actor doesn't
            if (targetCtx.allowedCategories.includes('*') && !ctx.allowedCategories.includes('*')) {
                return { error: 'Unauthorized: Cannot manage a user with global category access.' };
            }
            // If target has specific categories, actor must possess them all
            if (!ctx.allowedCategories.includes('*')) {
                for (const cat of targetCtx.allowedCategories) {
                    if (!ctx.allowedCategories.includes(cat)) {
                        return { error: `Unauthorized: Target user has access to category '${cat}' which you do not possess.` };
                    }
                }
            }

            // If target has full environment scope and actor doesn't
            if (targetCtx.allowedEnvironments.includes('*') && !ctx.allowedEnvironments.includes('*')) {
                return { error: 'Unauthorized: Cannot manage a user with global environment access.' };
            }
            // If target has specific environments, actor must possess them all
            if (!ctx.allowedEnvironments.includes('*')) {
                for (const env of targetCtx.allowedEnvironments) {
                    if (!ctx.allowedEnvironments.includes(env)) {
                        return { error: `Unauthorized: Target user has access to environment '${env}' which you do not possess.` };
                    }
                }
            }
        }

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

            if (session.user.role !== 'SUPER_ADMIN') {
                if (allowedCategories && !ctx.allowedCategories.includes('*')) {
                    const requestedCats = allowedCategories.split(',').filter(Boolean);
                    for (const c of requestedCats) {
                        if (!ctx.allowedCategories.includes(c)) return { error: `Unauthorized: Cannot grant Category scope '${c}' which you do not possess.` };
                    }
                }
                if (!allowedCategories && !ctx.allowedCategories.includes('*')) {
                    return { error: `Unauthorized: Cannot grant global Category scope ('*') which you do not possess.` };
                }

                if (allowedEnvironments && !ctx.allowedEnvironments.includes('*')) {
                    const requestedEnvs = allowedEnvironments.split(',').filter(Boolean);
                    for (const e of requestedEnvs) {
                        if (!ctx.allowedEnvironments.includes(e)) return { error: `Unauthorized: Cannot grant Environment scope '${e}' which you do not possess.` };
                    }
                }
                if (!allowedEnvironments && !ctx.allowedEnvironments.includes('*')) {
                    return { error: `Unauthorized: Cannot grant global Environment scope ('*') which you do not possess.` };
                }
            }
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
            const systemRole = formData.get('systemRole') as string; // 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'AUDITOR' | 'VIEWER'
            let newRole = systemRole || 'USER';

            if (newRole === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
                return { error: 'Unauthorized: Only Super Admins can assign the Super Admin role.' };
            }

            const roleToGroupName: Record<string, string> = {
                'SUPER_ADMIN': 'Super Admin',
                'ADMIN': 'Scoped Admin',
                'SCOPED_ADMIN': 'Scoped Admin',
                'USER': 'User',
                'AUDITOR': 'Auditor',
                'VIEWER': 'Viewer'
            };

            const targetGroupName = roleToGroupName[newRole] || 'User';
            const targetGroup = await prisma.userGroup.findUnique({
                where: { name: targetGroupName }
            });

            if (newRole !== 'SUPER_ADMIN') {
                const categories = formData.get('scopedCategories') as string;
                const environments = formData.get('scopedEnvironments') as string;

                if (session.user.role !== 'SUPER_ADMIN') {
                    if (categories && !ctx.allowedCategories.includes('*')) {
                        const requestedCats = categories.split(',').filter(Boolean);
                        for (const c of requestedCats) {
                            if (!ctx.allowedCategories.includes(c)) return { error: `Unauthorized: Cannot grant Category scope '${c}' which you do not possess.` };
                        }
                    }
                    if (!categories && !ctx.allowedCategories.includes('*')) {
                        return { error: `Unauthorized: Cannot grant global Category scope ('*') which you do not possess.` };
                    }

                    if (environments && !ctx.allowedEnvironments.includes('*')) {
                        const requestedEnvs = environments.split(',').filter(Boolean);
                        for (const e of requestedEnvs) {
                            if (!ctx.allowedEnvironments.includes(e)) return { error: `Unauthorized: Cannot grant Environment scope '${e}' which you do not possess.` };
                        }
                    }
                    if (!environments && !ctx.allowedEnvironments.includes('*')) {
                        return { error: `Unauthorized: Cannot grant global Environment scope ('*') which you do not possess.` };
                    }
                }

                if (targetGroup) {
                    groupsToAssign.push({
                        groupId: targetGroup.id,
                        categories: categories || null,
                        environments: environments || null
                    });
                }
            } else {
                if (targetGroup) {
                    groupsToAssign.push({
                        groupId: targetGroup.id,
                        categories: null,
                        environments: null
                    });
                }
            }

            updateData.role = newRole;

            // Safety check: Cannot deactivate/demote last Super Admin
            if ((newRole !== 'SUPER_ADMIN' || status !== 'ACTIVE') && existingUser.role === 'SUPER_ADMIN') {
                const activeAdminCount = await prisma.user.count({
                    where: {
                        role: 'SUPER_ADMIN',
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
            // Check limits if we are activating an inactive user
            if (status === 'ACTIVE' && existingUser.status !== 'ACTIVE') {
                const { getLicenseState } = await import('@/lib/license-enforcement');
                const licenseInfo = await getLicenseState();

                if (licenseInfo.state === 'UNACTIVATED' || licenseInfo.state === 'COMPROMISED') {
                    throw new Error('System is in an unactivated or compromised state.');
                }

                if (licenseInfo.activeUsers) {
                    const currentActiveUsers = await tx.user.count({ where: { status: 'ACTIVE' } });
                    if (currentActiveUsers >= licenseInfo.activeUsers) {
                        throw new Error('Active user limit reached as per your license. Please upgrade your license to re-activate this user.');
                    }
                }
            }

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
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const { getUserAccessContext, canAccess } = await import('@/lib/iam/permissions');
    const ctx = await getUserAccessContext(session.user.id, session.user, true);
    if (!canAccess(ctx, 'ADMIN_USERS_GROUPS', 'EDIT')) {
        return { error: 'Unauthorized' };
    }

    // Prevent admin from deleting their own account
    if (userId === session.user.id) {
        return { error: 'You cannot delete your own account.' };
    }

    try {
        // Safety check: Cannot delete the last remaining Super Admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, status: true }
        });

        if (user?.role === 'SUPER_ADMIN') {
            if (session.user.role !== 'SUPER_ADMIN') {
                return { error: 'Unauthorized: Only Super Admins can delete Super Admin users.' };
            }

            const activeAdminCount = await prisma.user.count({
                where: {
                    role: 'SUPER_ADMIN',
                    status: 'ACTIVE',
                    id: { not: userId }
                }
            });

            if (activeAdminCount === 0) {
                return { error: 'Action Denied: You cannot delete the last remaining Super Admin.' };
            }
        }

        // Target user scope validation for Scoped Admins
        if (session.user.role !== 'SUPER_ADMIN') {
            const targetCtx = await getUserAccessContext(userId, null, false);
            
            // If target has full category scope and actor doesn't
            if (targetCtx.allowedCategories.includes('*') && !ctx.allowedCategories.includes('*')) {
                return { error: 'Unauthorized: Cannot delete a user with global category access.' };
            }
            // If target has specific categories, actor must possess them all
            if (!ctx.allowedCategories.includes('*')) {
                for (const cat of targetCtx.allowedCategories) {
                    if (!ctx.allowedCategories.includes(cat)) {
                        return { error: `Unauthorized: Target user has access to category '${cat}' which you do not possess.` };
                    }
                }
            }

            // If target has full environment scope and actor doesn't
            if (targetCtx.allowedEnvironments.includes('*') && !ctx.allowedEnvironments.includes('*')) {
                return { error: 'Unauthorized: Cannot delete a user with global environment access.' };
            }
            // If target has specific environments, actor must possess them all
            if (!ctx.allowedEnvironments.includes('*')) {
                for (const env of targetCtx.allowedEnvironments) {
                    if (!ctx.allowedEnvironments.includes(env)) {
                        return { error: `Unauthorized: Target user has access to environment '${env}' which you do not possess.` };
                    }
                }
            }
        }

        // Perform Soft Delete
        const now = new Date();
        const dateStr = now.toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0]; // YYYYMMDD_HHMMSS approx

        // Fetch original email to append deleted timestamp
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        const newEmail = existingUser?.email 
            ? `${existingUser.email.split('@')[0]}_deleteduser_${dateStr}@${existingUser.email.split('@')[1] || 'deleted.local'}`
            : `deleted_${dateStr}_${userId.substring(0, 8)}@deleted.local`;

        await prisma.$transaction([
            // Invalidate/delete active login sessions for this user (if you have a Session model or similar, assuming Prisma handles session via tokens, we just wipe the DB secrets)
            // Note: VaultCred uses NextAuth JWT, but if there's a Session model, we delete it. If not, wiping passwordHash and MFA invalidates future tokens.
            // Update User record to DELETED and wipe sensitive fields
            prisma.user.update({
                where: { id: userId },
                data: {
                    status: 'DELETED',
                    email: newEmail,
                    passwordHash: null,
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    inviteToken: null,
                    inviteExpires: null,
                }
            }),
            // Optionally, clear group mappings
            prisma.userGroupMapping.deleteMany({
                where: { userId }
            })
        ]);

        revalidatePath('/dashboard/admin/users');
        revalidatePath('/admin/users');
        return { success: true, message: 'User deleted successfully' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteInvite(inviteId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const { getUserAccessContext, canAccess } = await import('@/lib/iam/permissions');
    const ctx = await getUserAccessContext(session.user.id, session.user, true);
    if (!canAccess(ctx, 'ADMIN_USERS_GROUPS', 'EDIT')) {
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
