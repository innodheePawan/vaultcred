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
 * Internal unauthenticated drift checker.
 * Safe to call during instrumented server bootstrap where Request headers are missing.
 */
export async function internalCheckDatabaseDrift() {
    try {
        const { Prisma } = await import('@prisma/client');

        // 1. Extract the exact expected schema by parsing the raw schema.prisma file directly
        // This ensures the developer workflow isn't blocked by needing to run `npx prisma generate` first
        const fs = await import('fs/promises');
        const path = await import('path');

        // AWS Amplify Standalone relocates files, so we loop over potential paths statically
        let schemaPath = '';
        const possibleSchemaPaths = [
            path.join(process.cwd(), 'prisma', 'schema.prisma'), // Standard local path
            path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'schema.prisma'), // Next.js Traced Prisma Client copy
            path.join(process.cwd(), '..', 'prisma', 'schema.prisma'), // Hoisted Next.js monorepo root
            path.join(process.cwd(), '.next', 'server', 'prisma', 'schema.prisma'), // Internal Next.js bundle output
            path.join(process.cwd(), '..', 'node_modules', '.prisma', 'client', 'schema.prisma') // Hoisted client bundle
        ];

        for (const sp of possibleSchemaPaths) {
            const exists = await fs.access(sp).then(() => true).catch(() => false);
            if (exists) {
                schemaPath = sp;
                break;
            }
        }

        if (!schemaPath) {
            schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma'); // Fallback
        }

        const schemaText = await fs.readFile(schemaPath, 'utf-8');

        const expectedSchema: { table: string, columns: string[] }[] = [];
        const modelBlocks = schemaText.split('model ').slice(1);

        for (const block of modelBlocks) {
            const lines = block.split('\n');
            const modelName = lines[0].split(' ')[0].trim();

            // Extract dbName from @@map("name") if it exists, otherwise lowercase model name
            let tableName = modelName.toLowerCase();
            const mapMatch = block.match(/@@map\("([^"]+)"\)/);
            if (mapMatch && mapMatch[1]) {
                tableName = mapMatch[1].toLowerCase();
            }

            const columns: string[] = [];
            for (const line of lines.slice(1)) {
                const trimmed = line.trim();
                // Skip empty lines, comments, and @@ directives
                if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
                    continue;
                }

                const parts = trimmed.split(/\s+/);
                if (parts.length >= 2) {
                    const type = parts[1];
                    const isRelation = trimmed.includes('@relation') || type.includes('[]');

                    // Prisma Primitive Scalars allow us to confidently know it's a real DB column 
                    // (Ignoring relations which are other Model names like 'UserGroup')
                    const isPrimitive = ['String', 'Int', 'Boolean', 'DateTime', 'Json', 'Float', 'Decimal', 'BigInt', 'Bytes'].some(p => type.startsWith(p));

                    if (isRelation || !isPrimitive) {
                        continue;
                    }

                    // It's a scalar column
                    let colName = parts[0].toLowerCase();
                    // Check if the column is renamed in DB using @map("name")
                    const colMapMatch = trimmed.match(/@map\("([^"]+)"\)/);
                    if (colMapMatch && colMapMatch[1]) {
                        colName = colMapMatch[1].toLowerCase();
                    }
                    columns.push(colName);
                }
            }
            expectedSchema.push({ table: tableName, columns });
        }

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
 * Checks if there is any drift between the Prisma schema and the actual database.
 * This is the Next.js Server Action called by the UI, protected by NextAuth.
 */
export async function checkDatabaseDrift() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized', drift: false };
    }
    return internalCheckDatabaseDrift();
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
