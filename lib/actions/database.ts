'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function getDatabaseInfo() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    const dbUrl = process.env.DATABASE_URL;
    let details = {
        type: 'Unknown',
        host: 'Unknown',
        port: 'Unknown',
        user: 'Unknown',
        database: 'Unknown',
        ssl: false
    };

    if (dbUrl) {
        try {
            const url = new URL(dbUrl);
            details = {
                type: url.protocol.replace(':', ''),
                host: url.hostname,
                port: url.port,
                user: url.username,
                database: url.pathname.replace('/', ''),
                ssl: url.searchParams.get('sslaccept') === 'strict' || url.searchParams.get('ssl') === 'true'
            };
        } catch (e) {
            console.error("Failed to parse DATABASE_URL", e);
        }
    }

    let status = 'Error';
    let latency = 0;

    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        latency = Date.now() - start;
        status = 'Connected';
    } catch (e: any) {
        status = 'Disconnected';
        console.error("Database connection check failed:", e.message);
    }

    return {
        ...details,
        status,
        latency
    };
}

/**
 * Checks if there is any drift between the Prisma schema and the actual database.
 * Returns true if synchronization is required.
 */
export async function checkDatabaseDrift() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized', drift: false };
    }

    const { exec } = await import('child_process');
    const util = await import('util');
    const execPromise = util.promisify(exec);

    try {
        // --exit-code returns 1 if there is drift
        await execPromise('npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --exit-code');
        return { drift: false };
    } catch (error: any) {
        // If it throws, it usually means exit code 1 (drift) or actual command error
        if (error.code === 1) {
            return { drift: true };
        }
        console.error("Drift check failed:", error);
        return { drift: false, error: error.message };
    }
}

/**
 * Triggers a database schema synchronization (prisma db push).
 */
export async function syncDatabaseAction() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    const { syncDatabase } = await import('@/lib/actions/setup');
    return syncDatabase();
}
