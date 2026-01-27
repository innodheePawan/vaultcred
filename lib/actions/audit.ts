'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export type AuditLogParams = {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    action?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

export async function logAudit(data: {
    action: string;
    details?: string;
    credentialId?: string;
    oldValue?: string;
    newValue?: string;
    userId?: string; // Optional override if session not available (e.g. during login)
    isPersonal?: boolean;
}) {
    try {
        // Check System Settings for Personal Audit Toggle
        if (data.isPersonal) {
            const settings = await prisma.systemSettings.findFirst({ select: { auditPersonalCredentials: true } });
            // If setting exists and is explicitly false, skip logging
            if (settings && settings.auditPersonalCredentials === false) {
                return;
            }
        }

        let userId = data.userId;

        // If no userId provided, try to get from session
        if (!userId) {
            const session = await auth();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        }

        // Get IP Address
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';

        // Create Log
        await prisma.auditLog.create({
            data: {
                action: data.action,
                oldValue: data.oldValue,
                newValue: data.newValue || data.details,
                performedById: userId,
                credentialId: data.credentialId,
                ipAddress: ip,
            }
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
        // Do not throw, audit failure should not block main action
    }
}

export async function getAuditLogs({
    page = 1,
    limit = 10,
    search = '',
    startDate,
    endDate,
    action,
    sortBy = 'performedOn',
    sortOrder = 'desc'
}: AuditLogParams) {
    const session = await auth();
    // derived permissions: Admin or Moderator (assume Moderator is in Moderator group)
    // For now, let's just check if they have a session.
    // Strict RBAC: Check if user has 'READ' permission on 'AUDIT' category?
    // Current system defaults to Roles. Let's assume anyone with Dashboard access (except maybe restricted viewers?)
    // Requirement says "Administrator" and likely "Moderator" and "Viewer" (Read only).
    // So basically any authenticated user in the system?

    if (!session?.user) {
        return { error: 'Unauthorized' };
    }

    // RBAC Check meant for Auditors or Admins
    const { getUserAccessContext, canAccess } = await import('@/lib/iam/permissions');

    // Debug Access
    console.log('[Audit] Checking access for:', session.user.id);

    let ctx;
    if (session.user.id === 'setup-temp-id') {
        ctx = { isAdmin: true, allowedCategories: ['*'], allowedEnvironments: ['*'], permissions: {} };
    } else {
        ctx = await getUserAccessContext(session.user.id);
    }

    console.log('[Audit] Context:', JSON.stringify(ctx, null, 2));

    // Check for 'AUDIT' permission or Admin status
    if (!ctx.isAdmin && !canAccess(ctx, null, null, 'AUDIT')) {
        console.error('[Audit] Access Denied');
        return { error: 'Unauthorized: Insufficient permissions to view Audit Logs' };
    }

    // Build Where Clause
    const where: any = {};

    // Scope Restriction for Non-Admins
    if (!ctx.isAdmin) {
        const credFilter: any = {};
        // If not '*', restrict to allowed list. If list is empty, effectively blocks access (in: []).
        if (!ctx.allowedCategories.includes('*')) {
            credFilter.category = { in: ctx.allowedCategories };
        }
        if (!ctx.allowedEnvironments.includes('*')) {
            credFilter.environment = { in: ctx.allowedEnvironments };
        }

        if (Object.keys(credFilter).length > 0) {
            where.credential = credFilter;
        }
    }

    if (search) {
        where.OR = [
            { action: { contains: search } }, // SQLite is case-insensitive by default? Usually yes.
            { ipAddress: { contains: search } },
            {
                performedBy: {
                    name: { contains: search }
                }
            },
            {
                credential: {
                    name: { contains: search }
                }
            }
        ];
    }

    if (action && action !== 'ALL') {
        where.action = action;
    }

    if (startDate || endDate) {
        where.performedOn = {};
        if (startDate) where.performedOn.gte = new Date(startDate);
        // End date should be end of day if only date string provided
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.performedOn.lte = end;
        }
    }

    // sort mapping
    const orderBy: any = {};
    if (sortBy === 'user') {
        orderBy.performedBy = { name: sortOrder };
    } else if (sortBy === 'credential') {
        orderBy.credential = { name: sortOrder };
    } else {
        orderBy[sortBy] = sortOrder;
    }

    try {
        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    performedBy: {
                        select: { name: true, email: true }
                    },
                    credential: {
                        select: { name: true, type: true }
                    }
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where })
        ]);

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return { error: 'Failed to fetch audit logs' };
    }
}
