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
        const { Prisma } = await import('@prisma/client');

        // 1. Extract the exact expected schema directly from Prisma's compiled DMMF engine
        const models = Prisma.dmmf.datamodel.models;
        const expectedSchema = models.map(m => ({
            table: (m.dbName || m.name).toLowerCase(),
            columns: m.fields
                .filter((f: any) => f.kind === 'scalar') // Only actual database columns
                .map((f: any) => (f.dbName || f.name).toLowerCase()) // Respect @map directives
        }));

        // 2. Query the actual database for existing tables and columns
        const existingColumnsResult = await prisma.$queryRaw<{ table_name: string, column_name: string }[]>`
            SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
        `;

        // 3. Organize the DB state into a quick lookup map
        const dbSchema: Record<string, string[]> = {};
        for (const row of existingColumnsResult) {
            const t = (row.table_name || (row as any).TABLE_NAME).toLowerCase();
            const c = (row.column_name || (row as any).COLUMN_NAME).toLowerCase();
            if (!dbSchema[t]) dbSchema[t] = [];
            dbSchema[t].push(c);
        }

        // 4. Compare expected vs actual
        const missingTables: string[] = [];
        const missingColumns: string[] = [];

        for (const expected of expectedSchema) {
            const dbCols = dbSchema[expected.table];
            if (!dbCols) {
                missingTables.push(expected.table);
                continue;
            }

            for (const expectedCol of expected.columns) {
                if (!dbCols.includes(expectedCol)) {
                    missingColumns.push(`${expected.table}.${expectedCol}`);
                }
            }
        }

        const hasDrift = missingTables.length > 0 || missingColumns.length > 0;

        if (hasDrift) {
            console.log(`[Drift Check] Drift detected! Missing Tables: ${missingTables.length}, Missing Columns: ${missingColumns.length}`);
            if (missingColumns.length > 0) console.log(`[Drift Check] Missing specific columns, e.g. ${missingColumns[0]}`);

            return {
                drift: true,
                missingTables,
                missingColumns,
            };
        }

        console.log('[Drift Check] All expected tables AND columns exist. No drift detected.');
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
