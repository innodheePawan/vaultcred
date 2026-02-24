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

    const { execFile } = await import('child_process');
    const path = await import('path');
    const util = await import('util');
    const os = await import('os');
    const execFilePromise = util.promisify(execFile);

    try {
        const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
        const proxyScriptPath = path.resolve(process.cwd(), 'scripts/prisma-proxy.js');
        const nodeCommand = 'node';

        // We run node directly because it avoids the platform-specific npx.cmd issues,
        // and the proxy script handles the rest.
        const useShell = process.platform === 'win32';

        const timeoutMs = 60000;
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                const err = new Error(`Command timed out after ${timeoutMs / 1000} seconds`);
                (err as any).code = "TIMEOUT";
                reject(err);
            }, timeoutMs);
        });

        console.log("[Drift Check] Spawning secure Prisma Proxy child process...");
        const spawnPromise = new Promise<{ code: number | null, stdout: string, stderr: string }>((resolve, reject) => {
            const { spawn } = require('child_process');

            const child = spawn(nodeCommand, [
                proxyScriptPath,
                'migrate', 'diff',
                '--from-schema-datasource', schemaPath,
                '--to-schema-datamodel', schemaPath,
                '--exit-code'
            ], {
                env: process.env, // Proxy script sanitizes this for us securely
                shell: useShell
            });

            let stdout = "";
            let stderr = "";

            child.stdout.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stdout += chunk;
                console.log(`[Drift Check STDOUT] ${chunk.trim()}`);
            });

            child.stderr.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stderr += chunk;
                console.error(`[Drift Check STDERR] ${chunk.trim()}`);
            });

            child.on('error', (err: Error) => reject(err));
            child.on('close', (code: number) => resolve({ code, stdout, stderr }));
        });

        const { code, stdout, stderr } = await Promise.race([spawnPromise, timeoutPromise]);

        console.log(`[Drift Check] Code: ${code}`);

        if (code === 2) {
            console.log("[Drift Check] Official drift detected (Code 2).");
            return { drift: true };
        }

        const combinedOutput = `${stdout}\n${stderr}`;
        if (combinedOutput.includes('[*] Changed the') || combinedOutput.includes('[+] Added')) {
            console.log("[Drift Check] Drift detected in output strings despite error.");
            return { drift: true, error: "Drift detected (environment error encountered).", code: String(code) };
        }

        if (code === 0) {
            return { drift: false };
        }

        const errMsg = stderr || stdout || "Unknown error during drift check";
        console.error("[Drift Check] Real Error:", errMsg);
        return {
            drift: false,
            error: errMsg.substring(0, 500),
            code: String(code || 'UNKNOWN')
        };
    } catch (error: any) {
        console.error(`[Drift Check] CATCH BLOCK HIT: ${error?.message || error}`);
        return {
            drift: false,
            error: String(error?.message || error).substring(0, 500),
            code: String(error?.code || 'UNKNOWN')
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
