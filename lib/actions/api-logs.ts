'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess, forbiddenError } from '@/lib/iam/permissions';
import { logForbiddenThrottled } from '@/lib/iam/authorize';

export type ApiLogParams = {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

export async function getApiLogs({
    page = 1,
    limit = 20,
    search = '',
    startDate,
    endDate,
    status,
    sortBy = 'timestamp',
    sortOrder = 'desc'
}: ApiLogParams) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const ctx = await getSafeUserContext(session.user.id);
    if (!canAccess(ctx, 'FEATURE:ACTIVITY_API_LOG', 'VIEW')) {
        logForbiddenThrottled(session.user.id, 'FEATURE:ACTIVITY_API_LOG', 'VIEW');
        return { error: 'Unauthorized' };
    }

    const where: any = {};

    if (search) {
        const searchNumber = Number(search);
        where.OR = [
            { clientName: { contains: search } },
            { endpoint: { contains: search } },
            { errorMessage: { contains: search } },
            { method: { contains: search } },
            { authType: { contains: search } },
            { ipAddress: { contains: search } },
            { userAgent: { contains: search } },
            { responseStatus: { contains: search } },
            ...( !isNaN(searchNumber) && search.trim() !== '' ? [{ httpStatusCode: searchNumber }] : [])
        ];
    }

    if (status && status !== 'ALL') {
        where.responseStatus = status;
    }

    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.timestamp.lte = end;
        }
    }

    try {
        const [data, total] = await Promise.all([
            prisma.apiActivityLog.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.apiActivityLog.count({ where })
        ]);

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error: any) {
        console.error("Failed to fetch API logs", error);
        return { error: 'Failed to fetch API logs' };
    }
}
