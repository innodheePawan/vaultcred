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
 * Uses direct SQL queries against information_schema instead of spawning child processes.
 * This approach is immune to AWS Amplify's credential proxy injection issues.
 */
export async function checkDatabaseDrift() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized', drift: false };
    }

    try {
        // These are the actual MySQL table names from the Prisma schema's @@map() directives
        const expectedTables = [
            'users',
            'security_ip_blocks',
            'user_invites',
            'iam_user_groups',
            'iam_user_group_mapping',
            'iam_access_groups',
            'iam_user_group_access',
            'iam_access_group_policy',
            'credential_master',
            'cred_password',
            'cred_api_oauth',
            'cred_key_cert',
            'cred_token',
            'cred_file',
            'cred_secure_note',
            'audit_log',
            'expiry_notification',
            'system_settings',
            'password_reset_tokens',
            'two_factor_reset_tokens',
            'security_login_logs',
            'security_login_logs_archive',
            'one_time_secrets',
        ];

        // Query the actual database for existing tables
        const existingTables = await prisma.$queryRaw<{ table_name: string }[]>`
            SELECT TABLE_NAME as table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
        `;

        const existingTableNames = existingTables.map(
            (t: any) => (t.table_name || t.TABLE_NAME || Object.values(t)[0]) as string
        );

        // Find missing tables
        const missingTables = expectedTables.filter(
            (t) => !existingTableNames.some((et) => et.toLowerCase() === t.toLowerCase())
        );

        // Find extra tables (in DB but not in schema)
        const extraTables = existingTableNames.filter(
            (t) => !expectedTables.some((et) => et.toLowerCase() === t.toLowerCase())
                && !t.startsWith('_')  // Ignore Prisma internal tables
        );

        const hasDrift = missingTables.length > 0;

        if (hasDrift) {
            console.log(`[Drift Check] Missing tables: ${missingTables.join(', ')}`);
            return {
                drift: true,
                missingTables,
                extraTables,
            };
        }

        console.log('[Drift Check] All expected tables exist. No drift detected.');
        return { drift: false };
    } catch (error: any) {
        console.error(`[Drift Check] SQL Error: ${error?.message || error}`);
        return {
            drift: false,
            error: String(error?.message || error).substring(0, 500),
            code: 'SQL_ERROR'
        };
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
