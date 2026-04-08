'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getSafeUserContext, canAccess, getScopeFilter, forbiddenError } from '@/lib/iam/permissions';
import { logForbiddenThrottled } from '@/lib/iam/authorize';

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
        // Skip logging if Database is not configured (Setup Mode)
        if (!process.env.DATABASE_URL) {

            return;
        }

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

        // Get IP Address safely (prevent basic X-Forwarded-For spoofing if Behind proper proxy)
        const headersList = await headers();
        // x-real-ip is typically set directly by load balancers (Nginx/AWS) and is much harder to spoof
        const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

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
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const ctx = await getSafeUserContext(session.user.id);
    if (!canAccess(ctx, 'FEATURE:ACTIVITY_SYSTEM_LOG', 'VIEW')) {
        logForbiddenThrottled(session.user.id, 'FEATURE:ACTIVITY_SYSTEM_LOG', 'VIEW');
        return { error: 'Unauthorized: Insufficient permissions to view Audit Logs' };
    }

    // Build Where Clause
    const where: any = {};

    // Scope Restriction — use getScopeFilter (isScoped flag prevents accidental ALL filtering)
    const scopeFilter = getScopeFilter(ctx, 'FEATURE:ACTIVITY_SYSTEM_LOG');
    if (scopeFilter.category || scopeFilter.environment) {
        where.credential = scopeFilter;
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

        return { error: 'Failed to fetch audit logs' };
    }
}
