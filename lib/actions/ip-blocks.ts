'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/actions/audit';
import { revalidatePath } from 'next/cache';
import { getSafeUserContext, canAccess, canEdit, forbiddenError } from '@/lib/iam/permissions';
import { logForbiddenThrottled } from '@/lib/iam/authorize';

/**
 * Fetch all IP security records.
 * Restricted to Super Admins only.
 */
export async function getIpSecurityRecords(page = 1, limit = 50) {
    const session = await auth();
    if (!session?.user?.id) throw forbiddenError();

    const ctx = await getSafeUserContext(session.user.id);
    if (!canAccess(ctx, 'FEATURE:ACTIVITY_IP_BLOCK', 'VIEW')) {
        logForbiddenThrottled(session.user.id, 'FEATURE:ACTIVITY_IP_BLOCK', 'VIEW');
        throw forbiddenError();
    }

    try {
        const skip = (page - 1) * limit;
        
        // Use raw SQL to fetch from security_ip_blocks for robustness against stale Prisma client
        const records: any[] = await prisma.$queryRaw`
            SELECT 
                ip_security_id as id,
                ip_address as ipAddress,
                failed_attempts as failedAttempts,
                blocked_until as blockedUntil,
                block_count_24h as blockCount24h,
                total_block_count as totalBlockCount,
                last_block_at as lastBlockAt,
                is_permanent_block as isPermanentBlock,
                updated_at as updatedAt
            FROM security_ip_blocks
            ORDER BY last_block_at DESC, updated_at DESC
            LIMIT ${limit} OFFSET ${skip}
        `;

        const totalRes: any[] = await prisma.$queryRaw`SELECT COUNT(*) as c FROM security_ip_blocks`;
        const total = Number(totalRes[0].c || 0);

        return {
            data: records,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        return { data: [], total: 0, page: 1, totalPages: 0 };
    }
}

/**
 * Remove an IP security record (Unblock).
 * Restricted to Super Admins only.
 */
export async function unblockIp(ipAddress: string) {
    const session = await auth();
    if (!session?.user?.id) throw forbiddenError();

    const ctx = await getSafeUserContext(session.user.id);
    if (!canEdit(ctx, 'FEATURE:ACTIVITY_IP_BLOCK')) {
        logForbiddenThrottled(session.user.id, 'FEATURE:ACTIVITY_IP_BLOCK', 'EDIT');
        throw forbiddenError();
    }

    try {
        // Use raw SQL for deletion
        await prisma.$executeRaw`
            DELETE FROM security_ip_blocks 
            WHERE ip_address = ${ipAddress}
        `;

        await logAudit({
            action: 'UNBLOCK_IP',
            details: `Super Admin unblocked IP address: ${ipAddress}`
        });

        revalidatePath('/admin/security-events');
        return { success: true };
    } catch (error) {

        return { error: 'Failed to unblock IP address.' };
    }
}
