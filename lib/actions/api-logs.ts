'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
    if (!session?.user || session.user.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    const where: any = {};

    if (search) {
        where.OR = [
            { clientName: { contains: search } },
            { endpoint: { contains: search } },
            { requestId: { contains: search } },
            { errorMessage: { contains: search } }
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
