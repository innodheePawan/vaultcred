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
}) {
    try {
        let userId = data.userId;

        // If no userId provided, try to get from session
        if (!userId) {
            const session = await auth();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        }

        // Attempt to get IP
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';

        await prisma.auditLog.create({
            data: {
                action: data.action,
                oldValue: data.details || data.oldValue, // Map details to oldValue or use separate field if schema allows? Schema has oldValue/newValue. 
                // Wait, schema has oldValue and newValue. Details is not in schema. 
                // Let's check schema again.
                // Schema: action, oldValue, newValue, performedById, credentialId, ipAddress.
                // It does NOT have 'details'. 
                // So I should map 'details' to 'newValue' or just format it into one of them.
                // Usually 'details' implies a description. I'll put it in newValue for now or concat.
                newValue: data.newValue || data.details,
                oldValue: data.oldValue,
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

    // Build Where Clause
    const where: any = {};

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
