'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export type AuditAction =
    | 'CREATE_CREDENTIAL'
    | 'UPDATE_CREDENTIAL'
    | 'DELETE_CREDENTIAL'
    | 'VIEW_CREDENTIAL'
    | 'COPY_SECRET'
    | 'CREATE_INVITE'
    | 'REGISTER_USER'
    | 'LOGIN'
    | 'LOGOUT';

export async function logAudit({
    action,
    details,
    credentialId,
    userId,
}: {
    action: AuditAction;
    details?: string;
    credentialId?: string;
    userId?: string;
}) {
    try {
        const session = await auth();
        const actorId = userId || session?.user?.id;

        // Get IP - simplified, in real app needs PROXY trust config
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || 'unknown';

        await prisma.auditLog.create({
            data: {
                action,
                details,
                credentialId,
                userId: actorId,
                ipAddress,
            }
        });
    } catch (error) {
        console.error('Failed to log audit:', error);
        // We probably don't want to crash the request if audit fails, but we should know
    }
}

export async function getAuditLogs() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    return await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        include: {
            user: { select: { name: true, email: true } },
            credential: { select: { name: true } }
        },
        take: 100 // Limit for now
    });
}
