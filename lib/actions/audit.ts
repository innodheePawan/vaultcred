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

// Support optional Transaction Client type
type PrismaTx = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function logAudit({
    action,
    details,
    credentialId,
    performedById,
}: {
    action: AuditAction;
    details?: string;
    credentialId?: string;
    performedById?: string;
}, tx?: PrismaTx) {
    try {
        const session = await auth();
        const actorId = performedById || session?.user?.id;

        // Get IP - simplified
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || 'unknown';

        const db = tx || prisma; // Use transaction if provided

        await db.auditLog.create({
            data: {
                action,
                oldValue: details, // Mapping 'details' to 'oldValue' or 'newValue' is tricky without more info. Schema has old/new value.
                // For now, let's treat 'details' as 'newValue' or just put it in 'action'?
                // Wait, Schema has 'oldValue' and 'newValue' but I removed 'details' column? 
                // Let's check schema: action, oldValue, newValue, performedBy, performedOn, ipAddress.
                // No 'details' column. 
                // I will put the description in 'newValue' for simple events, or maybe I should have kept 'details'?
                // I'll put it in 'newValue' as a JSON string or plain text for now.
                newValue: details,
                credentialId,
                performedById: actorId,
                ipAddress,
            }
        });
    } catch (error) {
        console.error('Failed to log audit:', error);
    }
}

export async function getAuditLogs() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    return await prisma.auditLog.findMany({
        orderBy: { performedOn: 'desc' },
        include: {
            performedBy: { select: { name: true, email: true } },
            credential: { select: { name: true } }
        },
        take: 100
    });
}

