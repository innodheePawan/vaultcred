'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export type LoginOutcome = 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'LOGOUT';
export type LoginCategory = 'AUTHENTICATION' | 'MFA' | 'ACCOUNT_STATUS';

export type LogActivityParams = {
    email: string;
    outcome: LoginOutcome;
    category: LoginCategory;
    reasonCode: string;
    reasonMessage?: string;
    authMethod: string;
    ipAddress?: string;
    userAgent?: string;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
};

/**
 * Logs a login attempt with structured data and client context.
 */
export async function logLoginActivity(params: LogActivityParams) {
    try {
        const headersList = await headers();
        const ip = params.ipAddress || headersList.get('x-forwarded-for') || 'unknown';
        const ua = params.userAgent || headersList.get('user-agent') || 'unknown';

        // Derived Risk Level logic if not provided
        let riskLevel = params.riskLevel;
        if (!riskLevel) {
            if (params.outcome === 'BLOCKED') riskLevel = 'HIGH';
            else if (params.outcome === 'LOGOUT') riskLevel = 'LOW';
            else if (params.outcome === 'FAILURE' && params.category === 'MFA') riskLevel = 'MEDIUM';
            else if (params.outcome === 'FAILURE') riskLevel = 'LOW';
            else riskLevel = 'LOW';
        }

        await prisma.loginLog.create({
            data: {
                email: params.email,
                outcome: params.outcome,
                category: params.category,
                reasonCode: params.reasonCode,
                reasonMessage: params.reasonMessage,
                authMethod: params.authMethod,
                ipAddress: ip,
                userAgent: ua,
                riskLevel: riskLevel,
                // geoCountry could be added here via a library or external API if needed
                geoCountry: null
            }
        });
    } catch (error) {
        console.error('[Login History] Failed to log activity:', error);
    }
}

/**
 * Specifically logs user logout.
 */
export async function logUserLogout() {
    try {
        const session = await auth();
        if (!session?.user?.email) return;

        await logLoginActivity({
            email: session.user.email,
            outcome: 'LOGOUT',
            category: 'AUTHENTICATION',
            reasonCode: 'AUTH_LOGOUT',
            reasonMessage: 'User signed out successfully.',
            authMethod: 'SESSION'
        });
    } catch (error) {
        console.error('[Logout] Failed to log logout:', error);
    }
}

/**
 * Fetch login logs with filtering and pagination.
 */
export async function getLoginLogs(params: {
    page?: number;
    limit?: number;
    email?: string;
    outcome?: string;
    category?: string;
    ipAddress?: string;
}) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const { page = 1, limit = 20, email, outcome, category, ipAddress } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (email) where.email = { contains: email };
    if (outcome && outcome !== 'ALL') where.outcome = outcome;
    if (category && category !== 'ALL') where.category = category;
    if (ipAddress) where.ipAddress = { contains: ipAddress };

    try {
        const [logs, total] = await Promise.all([
            prisma.loginLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit,
            }),
            prisma.loginLog.count({ where })
        ]);

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('[Login History] Error fetching logs:', error);
        return { logs: [], total: 0, page: 1, totalPages: 0 };
    }
}

/**
 * Archive successful login logs older than a specific date into cold storage.
 */
export async function archiveLoginLogs() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    try {
        // Archive successful logs older than 7 days for now (configurable later)
        const archiveDate = new Date();
        archiveDate.setDate(archiveDate.getDate() - 7);

        const batchId = randomUUID();

        const logsToArchive = await prisma.loginLog.findMany({
            where: {
                outcome: 'SUCCESS',
                timestamp: { lt: archiveDate }
            }
        });

        if (logsToArchive.length === 0) {
            return { success: true, message: 'No records found to archive.', count: 0 };
        }

        // Transactional move: Copy to Archive -> Delete from Active -> Update Settings
        await prisma.$transaction(async (tx) => {
            // 1. Bulk insert into Archive
            await tx.loginLogArchive.createMany({
                data: logsToArchive.map((log: any) => ({
                    originalLogId: log.id,
                    email: log.email,
                    outcome: log.outcome,
                    category: log.category,
                    reasonCode: log.reasonCode,
                    reasonMessage: log.reasonMessage,
                    authMethod: log.authMethod,
                    ipAddress: log.ipAddress,
                    userAgent: log.userAgent,
                    deviceFingerprint: log.deviceFingerprint,
                    geoCountry: log.geoCountry,
                    riskLevel: log.riskLevel,
                    timestamp: log.timestamp,
                    archiveBatchId: batchId,
                    archivedBy: 'SYSTEM'
                }))
            });

            // 2. Delete from Active
            await tx.loginLog.deleteMany({
                where: {
                    id: { in: logsToArchive.map((l: any) => l.id) }
                }
            });

            // 3. Update last archival status in SystemSettings
            await tx.systemSettings.upsert({
                where: { id: 1 },
                update: {
                    lastLoginArchivedAt: new Date(),
                    lastArchiveBatchId: batchId
                },
                create: {
                    id: 1,
                    applicationName: 'CredSecure',
                    lastLoginArchivedAt: new Date(),
                    lastArchiveBatchId: batchId
                }
            });
        });

        revalidatePath('/admin/security-events');
        return { success: true, message: `Successfully archived ${logsToArchive.length} records.`, count: logsToArchive.length };
    } catch (error) {
        console.error('[Login History] Archival error:', error);
        return { success: false, error: 'Failed to archive records.' };
    }
}

/**
 * Get the last archival timestamp.
 */
export async function getArchivalStatus() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') return null;

    const settings = await prisma.systemSettings.findUnique({
        where: { id: 1 },
        select: { lastLoginArchivedAt: true, lastArchiveBatchId: true }
    });

    return settings;
}
