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
    let masterKey = '';
    let authSecret = '';

    try {
        const envPath = path.resolve(process.cwd(), '.env');
        let envContent = '';
        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch (e) { }

        // Add/Update DATABASE_URL
        const dbUrlLine = `DATABASE_URL="${dbUrl}"`;
        if (envContent.includes('DATABASE_URL=')) {
            envContent = envContent.replace(/^#?\s*DATABASE_URL=.*/m, dbUrlLine);
        } else {
            envContent += `\n${dbUrlLine}\n`;
        }

        // Generate Secrets if missing
        const { randomBytes } = await import('crypto');
        if (!envContent.includes('MASTER_KEY=')) {
            masterKey = randomBytes(32).toString('hex');
            envContent += `MASTER_KEY="${masterKey}"\n`;
        } else {
            const match = envContent.match(/MASTER_KEY="?([^"\n]*)"?/);
            if (match) masterKey = match[1];
        }

        if (!envContent.includes('NEXTAUTH_SECRET=') && !envContent.includes('AUTH_SECRET=')) {
            authSecret = randomBytes(32).toString('hex');
            envContent += `NEXTAUTH_SECRET="${authSecret}"\n`;
        } else {
            const match = envContent.match(/(?:NEXTAUTH_SECRET|AUTH_SECRET)="?([^"\n]*)"?/);
            if (match) authSecret = match[1];
        }

        try {
            await fs.writeFile(envPath, envContent, 'utf8');
        } catch (fsError) {
            envUpdateSuccess = false;
        }

        return {
            success: true,
            envUpdateSuccess,
            envVars: {
                DATABASE_URL: dbUrl,
                MASTER_KEY: masterKey,
                NEXTAUTH_SECRET: authSecret || process.env.NEXTAUTH_SECRET
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
    try {
        await execPromise(`npx prisma db push --accept-data-loss`, {
            env: { ...process.env, DATABASE_URL: dbUrl },
            timeout: 45000 // 45 seconds to avoid early timeout
        });
        return { success: true };
    } catch (error: any) {
        console.error('[Setup] DB Sync Failed:', error);
        return { error: error.message };
    }
}

/**
 * PHASE 3: Seed Initial Data
 */
export async function seedDatabase(dbUrl: string, adminEmail: string, adminPasswordRaw: string) {
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
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
        return { error: 'Connection Failed: ' + error.message };
    } finally {
        await prisma.$disconnect();
    }
}
