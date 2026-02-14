'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { seedRoles } from '@/scripts/seed-roles';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const execPromise = util.promisify(exec);

/**
 * PHASE 1: Prepare Environment
 * Generates secrets and attempts to write to .env
 */
export async function prepareEnvironment(formData: FormData) {
    const dbHost = formData.get('dbHost') as string;
    const dbUser = formData.get('dbUser') as string;
    const dbPassword = formData.get('dbPassword') as string;
    const dbName = formData.get('dbName') as string;
    const dbPort = formData.get('dbPort') as string || '3306';

    const dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
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

        // 1. Determine/Generate MASTER_KEY
        let masterKey = '';
        const mkMatch = envContent.match(/MASTER_KEY="?([^"\n]*)"?/);
        if (mkMatch && mkMatch[1]) {
            masterKey = mkMatch[1];
        } else {
            masterKey = process.env.MASTER_KEY || randomBytes(32).toString('hex');
        }

        // 2. Determine/Generate NEXTAUTH_SECRET (or AUTH_SECRET)
        let authSecret = '';
        const asMatch = envContent.match(/(?:NEXTAUTH_SECRET|AUTH_SECRET)="?([^"\n]*)"?/);
        if (asMatch && asMatch[1]) {
            authSecret = asMatch[1];
        } else {
            authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || randomBytes(32).toString('hex');
        }

        // 3. Construct new content
        const dbUrlLine = `DATABASE_URL="${dbUrl}"`;
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

        envContent = updateLine(envContent, 'DATABASE_URL', dbUrlLine);
        envContent = updateLine(envContent, 'MASTER_KEY', mkLine);
        envContent = updateLine(envContent, 'NEXTAUTH_SECRET', asLine);

        // 4. Attempt to write
        try {
            await fs.writeFile(envPath, envContent, 'utf8');
        } catch (fsError) {
            console.warn('[Setup] Could not write .env file (likely read-only FS).');
            envUpdateSuccess = false;
        }

        return {
            success: true,
            envUpdateSuccess,
            envVars: {
                DATABASE_URL: dbUrl,
                MASTER_KEY: masterKey,
                NEXTAUTH_SECRET: authSecret
            }
        };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * PHASE 2: Sync Database Schema
 */
export async function syncDatabase(dbUrl: string) {
    console.log(`[Setup] Starting Database Sync at ${new Date().toISOString()}`);
    try {
        // HOME: '/tmp' is often required in serverless environments (like AWS Amplify)
        // to give npm/npx a writable directory for its cache.
        const { stdout, stderr } = await execPromise(`npx prisma db push --accept-data-loss`, {
            env: { ...process.env, DATABASE_URL: dbUrl, HOME: '/tmp' },
            timeout: 300000 // Increased to 300 seconds (5 minutes)
        });

        if (stderr && !stderr.includes('The database is already in sync')) {
            console.warn('[Setup] Sync Warning/Error Output:', stderr);
        }

        console.log('[Setup] Sync Output:', stdout);
        return { success: true, log: stdout };
    } catch (error: any) {
        console.error('[Setup] DB Sync CRITICAL FAILURE:', error);
        // Include as much info as possible in the return
        return {
            error: error.message || 'Unknown shell error',
            stderr: error.stderr || '',
            stdout: error.stdout || '',
            code: error.code
        };
    }
}

/**
 * PHASE 3: Seed Initial Data
 */
export async function seedDatabase(dbUrl: string, adminEmail: string, adminPasswordRaw: string) {
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
                name: 'System Admin',
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
            update: {},
            create: {
                id: 1,
                applicationName: 'CRED Secure',
                companyName: 'Innodhee Services Pvt Ltd'
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('[Setup] Seed Failed:', error);
        return { error: error.message };
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * PHASE 1: Purge Database
 * Purges all data from the database to ensure a clean start.
 * Order respects foreign key constraints.
 */
export async function purgeDatabase(dbUrl: string) {
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
        console.log('[Setup] Purging existing data...');

        // Resilient deletion: wrap each in try/catch in case tables don't exist yet
        const safeDelete = async (model: any) => {
            try { await model.deleteMany({}); } catch (e) { }
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
        return { error: error.message };
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
export async function testDbConnection(formData: FormData) {
    const dbHost = formData.get('dbHost') as string;
    const dbUser = formData.get('dbUser') as string;
    const dbPassword = formData.get('dbPassword') as string;
    const dbName = formData.get('dbName') as string;
    const dbPort = formData.get('dbPort') as string || '3306';
    const dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        return { success: 'Connection established successfully!' };
    } catch (error: any) {
        console.error('[Setup] DB Connection Test Failed:', error);
        return { error: 'Connection Failed: ' + (error.message || error) };
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
        results.fs.envStats = stats;
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
