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
    const path = await import('path');
    const util = await import('util');
    const execPromise = util.promisify(exec);

    try {
        const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
        // direction: from DB to Schema. If Schema is ahead, it will show "Add Column"
        const cmd = `npx prisma migrate diff --from-schema-datasource "${schemaPath}" --to-schema-datamodel "${schemaPath}" --exit-code`;

        await execPromise(cmd, { env: { ...process.env } });
        return { drift: false };
    } catch (error: any) {
        // Prisma migrate diff --exit-code returns:
        // 0: No changes
        // 1: Error
        // 2: Drift detected (sync required)

        const stdout = error.stdout || "";
        const stderr = error.stderr || "";
        const message = error.message || "";
        const combinedOutput = `${stdout}\n${stderr}\n${message}`;

        console.log(`[Drift Check] Code: ${error.code}`);

        // Code 2 is the official Prisma exit code for "Drift Detected"
        if (error.code === 2) {
            console.log("[Drift Check] Official drift detected (Code 2).");
            return { drift: true };
        }

        // Fallback: If it exited with Code 1 but still outputted drift info
        if (combinedOutput.includes('[*] Changed the') || combinedOutput.includes('[+] Added')) {
            console.log("[Drift Check] Drift detected in output strings despite error.");
            return { drift: true, error: "Drift detected (environment error encountered).", code: error.code };
        }

        // Real errors (Code 1 or other system errors)
        const errMsg = stderr || message || "Unknown error during drift check";
        console.error("[Drift Check] Real Error:", errMsg);
        return { drift: false, error: errMsg, code: error.code };
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
