'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { seedRoles } from '@/scripts/seed-roles';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const execPromise = util.promisify(exec);

export async function prepareEnvironment(formData: FormData) {
    const dbHost = formData.get('dbHost') as string;
    const dbUser = formData.get('dbUser') as string;
    const dbPassword = formData.get('dbPassword') as string;
    const dbName = formData.get('dbName') as string;
    const dbPort = formData.get('dbPort') as string || '3306';

    // Only construct new dbUrl if credentials are provided in formData
    // Otherwise, we preserve the existing DATABASE_URL from process.env
    let dbUrl = process.env.DATABASE_URL || '';
    if (dbHost && dbUser && dbName) {
        dbUrl = `mysql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
        console.log(`[Setup] Updating Database URL to: ${dbHost}:${dbPort}/${dbName}`);
    } else {
        console.log(`[Setup] Preserving existing DATABASE_URL from environment.`);
    }
    let envUpdateSuccess = true;

    try {
        const { randomBytes } = await import('crypto');
        const envPath = path.resolve(process.cwd(), '.env');
        let envContent = '';

        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch (e) {
            // File doesn't exist or isn't readable, which is fine for cloud
        }

        // 1. Determine DATABASE_URL
        // Priority: formData (explicit update) > process.env (runtime) > .env file (saved)
        let dbUrlForUpdate = '';
        if (dbHost && dbUser && dbName) {
            dbUrlForUpdate = `mysql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
            console.log(`[Setup] Updating DATABASE_URL to new value from parameters.`);
        } else {
            // Preservation logic
            const dbMatch = envContent.match(/DATABASE_URL="?([^"\n]*)"?/);
            if (dbMatch && dbMatch[1]) {
                dbUrlForUpdate = dbMatch[1];
                console.log('[Setup] Preserving DATABASE_URL from .env file.');
            } else {
                dbUrlForUpdate = process.env.DATABASE_URL || '';
                if (dbUrlForUpdate) console.log('[Setup] Preserving DATABASE_URL from system environment.');
            }
        }

        // 2. Determine/Generate MASTER_KEY
        let masterKey = '';
        const mkMatch = envContent.match(/MASTER_KEY="?([^"\n]*)"?/);
        if (mkMatch && mkMatch[1]) {
            masterKey = mkMatch[1];
        } else {
            masterKey = process.env.MASTER_KEY || randomBytes(32).toString('hex');
        }

        // 3. Determine/Generate NEXTAUTH_SECRET (or AUTH_SECRET)
        let authSecret = '';
        const asMatch = envContent.match(/(?:NEXTAUTH_SECRET|AUTH_SECRET)="?([^"\n]*)"?/);
        if (asMatch && asMatch[1]) {
            authSecret = asMatch[1];
        } else {
            authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || randomBytes(32).toString('hex');
        }

        // 4. Construct new content
        const dbUrlLine = `DATABASE_URL="${dbUrlForUpdate}"`;
        const mkLine = `MASTER_KEY="${masterKey}"`;
        const asLine = `NEXTAUTH_SECRET="${authSecret}"`;

        // Update or add lines
        const updateLine = (content: string, key: string, newLine: string) => {
            const regex = new RegExp(`^#?\\s*${key}=.*`, 'm');
            if (content.match(regex)) {
                return content.replace(regex, newLine);
            }
            return content + (content.length > 0 && !content.endsWith('\n') ? '\n' : '') + newLine + '\n';
        };

        if (dbUrlForUpdate) envContent = updateLine(envContent, 'DATABASE_URL', dbUrlLine);
        envContent = updateLine(envContent, 'MASTER_KEY', mkLine);
        envContent = updateLine(envContent, 'NEXTAUTH_SECRET', asLine);

        // 5. Attempt to write
        try {
            await fs.writeFile(envPath, envContent, 'utf8');
        } catch (fsError) {
            console.warn('[Setup] Could not write .env file (likely read-only FS).');
            envUpdateSuccess = false;
        }

        const mask = (s: string) => s ? `${s.substring(0, 4)}...${s.substring(s.length - 4)}` : 'MISSING';
        console.log(`[Setup] Generated Secrets - MASTER_KEY: ${mask(masterKey)}, AUTH_SECRET: ${mask(authSecret)}`);

        return {
            success: true,
            envUpdateSuccess,
            secrets: {
                MASTER_KEY: masterKey,
                AUTH_SECRET: authSecret,
                NEXTAUTH_SECRET: authSecret
            }
        };
    } catch (error: any) {
        console.error('[Setup] Prepare Env Failed:', error);
        return { error: String(error.message || error) };
    }
}

import { spawn } from 'child_process';
import { updateTaskStatus, appendTaskLog, getTaskStatus, clearTaskStatus } from '@/lib/setup-task';

/**
 * PHASE 2: Sync Database Schema (Asynchronous with Polling)
 */
export async function syncDatabase() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return { error: 'DATABASE_URL not configured' };

    // Clear previous status before starting
    await clearTaskStatus();
    await updateTaskStatus({
        status: 'RUNNING',
        logs: ['[ASYNC] Starting Database Schema Synchronization...'],
        startTime: new Date().toISOString()
    });

    try {
        const prismaPath = path.resolve(process.cwd(), 'node_modules', '.bin', 'prisma');
        console.log(`[Setup] Spawning Async DB Sync: ${prismaPath}`);

        // Spawn process - we DON'T await it here to avoid HTTP timeout
        const child = spawn(prismaPath, ['db', 'push', '--accept-data-loss'], {
            env: { ...process.env, DATABASE_URL: dbUrl, HOME: '/tmp' },
            cwd: process.cwd(),
            detached: true, // Try to keep alive
            stdio: 'pipe'
        });

        // Capture output
        child.stdout.on('data', (data) => {
            const line = data.toString().trim();
            if (line) appendTaskLog(line);
        });

        child.stderr.on('data', (data) => {
            const line = data.toString().trim();
            if (line) appendTaskLog(`[ERROR] ${line}`);
        });

        child.on('close', (code) => {
            console.log(`[Setup] Async Sync finished with code ${code}`);
            if (code === 0) {
                updateTaskStatus({ status: 'SUCCESS', endTime: new Date().toISOString() });
            } else {
                updateTaskStatus({ status: 'FAILED', endTime: new Date().toISOString(), error: `Process exited with code ${code}` });
            }
        });

        // Unref to allow the parent process to exit independently if needed
        // (Though in a server action, the parent won't exit until the action returns)
        child.unref();

        return { success: true, async: true, status: 'STARTED' };

    } catch (error: any) {
        console.error('[Setup] DB Sync CRITICAL FAILURE:', error);
        await updateTaskStatus({ status: 'FAILED', error: String(error.message) });
        return {
            error: String(error.message || 'Unknown spawn error')
        };
    }
}

/**
 * POLLEABLE ACTION: Get current sync status
 */
export async function getSyncStatusAction() {
    return await getTaskStatus();
}

/**
 * PHASE 3: Seed Initial Data
 */
export async function seedDatabase(adminEmail: string, adminPasswordRaw: string) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return { error: 'DATABASE_URL not configured' };
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
        // Purge is now handled in a separate Phase 1

        // A. Roles
        await seedRoles(prisma);

        // B. Admin User
        const hashedPassword = await hash(adminPasswordRaw, 12);
        const user = await prisma.user.upsert({
            where: { email: adminEmail },
            update: { passwordHash: hashedPassword, role: 'ADMIN', status: 'ACTIVE' },
            create: {
                email: adminEmail,
                passwordHash: hashedPassword,
                name: 'Super Administrator',
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });

        const adminGroup = await prisma.userGroup.findUnique({ where: { name: 'Administrator' } });
        if (adminGroup) {
            await prisma.userGroupMapping.upsert({
                where: { userId_groupId: { userId: user.id, groupId: adminGroup.id } },
                update: {},
                create: { userId: user.id, groupId: adminGroup.id, assignedBy: 'SYSTEM' }
            });
        }

        // C. System Branding
        await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: {
                logoUrl: '/logo.png'
            },
            create: {
                id: 1,
                applicationName: 'CRED Secure',
                companyName: 'Innodhee Services Pvt Ltd',
                logoUrl: '/logo.png'
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('[Setup] Seed Failed:', error);
        return { error: String(error.message || error) };
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * PHASE 1: Purge Database
 * Purges all data from the database to ensure a clean start.
 * Order respects foreign key constraints.
 */
export async function purgeDatabase() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return { error: 'DATABASE_URL not configured' };
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
        console.log('[Setup] Purging existing data...');

        // Resilient deletion: wrap each in try/catch in case tables don't exist yet
        const safeDelete = async (model: any) => {
            try { await model.deleteMany({}); } catch (e) { /* console.warn(`Failed to delete from ${model.name}:`, e.message); */ }
        };

        // Type-specific credential details
        await safeDelete(prisma.credPassword);
        await safeDelete(prisma.credApiOAuth);
        await safeDelete(prisma.credKeyCert);
        await safeDelete(prisma.credToken);
        await safeDelete(prisma.credFile);
        await safeDelete(prisma.credSecureNote);

        // Audit and Notifications
        await safeDelete(prisma.auditLog);
        await safeDelete(prisma.expiryNotification);

        // Master Credentials
        await safeDelete(prisma.credentialMaster);

        // Invite and Tokens
        await safeDelete(prisma.invite);
        await safeDelete(prisma.passwordResetToken);

        // IAM Mapping
        await safeDelete(prisma.userGroupMapping);
        await safeDelete(prisma.userGroupAccess);
        await safeDelete(prisma.accessGroupPolicy);

        // IAM Groups
        await safeDelete(prisma.userGroup);
        await safeDelete(prisma.accessGroup);

        // Logs
        await safeDelete(prisma.loginLog);
        await safeDelete(prisma.loginLogArchive);

        // Security
        await safeDelete(prisma.ipSecurity);

        // Users
        await safeDelete(prisma.user);

        // Settings
        await safeDelete(prisma.systemSettings);

        console.log('[Setup] Purge complete.');
        return { success: true };
    } catch (error: any) {
        console.error('[Setup] Purge Failed:', error);
        return { error: String(error.message || error) };
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Legacy wrapper for compatibility (if needed)
 */
export async function configureSystem(formData: FormData) {
    return prepareEnvironment(formData);
}

/**
 * Tests connection
 */
export async function testDbConnection() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return { error: 'DATABASE_URL not configured' };
    console.log(`[Setup] Testing connection to configured DATABASE_URL`);

    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        return { success: 'Connection established successfully!' };
    } catch (error: any) {
        console.error('[Setup] DB Connection Test Failed:', error);
        return { error: 'Connection Failed: ' + String(error.message || error) };
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Diagnostic tool to check environment capabilities
 */
export async function performDiagnostics() {
    const results: any = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DB_URL_SET: !!process.env.DATABASE_URL,
            MK_SET: !!process.env.MASTER_KEY,
            AS_SET: !!process.env.NEXTAUTH_SECRET,
        },
        fs: {},
        shell: {}
    };

    // Check FS
    try {
        const testPath = path.resolve(process.cwd(), '.env');
        await fs.access(testPath);
        results.fs.envAccess = 'READABLE';
        const stats = await fs.stat(testPath);
        results.fs.envStats = {
            size: stats.size,
            mtime: stats.mtime.toISOString(),
            atime: stats.atime.toISOString(),
            ctime: stats.ctime.toISOString(),
            mode: stats.mode
        };
    } catch (e: any) {
        results.fs.envAccess = `ERROR: ${e.message}`;
    }

    // Check /tmp
    try {
        await fs.access('/tmp');
        results.fs.tmpAccess = 'ACCESSIBLE';
    } catch (e: any) {
        results.fs.tmpAccess = `ERROR: ${e.message}`;
    }

    // Check Shell
    try {
        const { stdout } = await execPromise('npx prisma --version');
        results.shell.prisma = stdout.trim();
    } catch (e: any) {
        results.shell.prisma = `FAILURE: ${e.message}`;
    }

    return results;
}
