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
 * Tests the database connection without modifying any state.
 */
export async function testDbConnection(formData: FormData) {
    const dbHost = formData.get('dbHost') as string;
    const dbUser = formData.get('dbUser') as string;
    const dbPassword = formData.get('dbPassword') as string;
    const dbName = formData.get('dbName') as string;
    const dbPort = formData.get('dbPort') as string || '3306';

    const dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

    const prisma = new PrismaClient({
        datasources: { db: { url: dbUrl } },
    });

    try {
        // Try to query something simple
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        return { success: 'Connection established successfully!' };
    } catch (error: any) {
        console.error('[Setup] DB Connection Test Failed:', error);
        return { error: 'Connection Failed: ' + (error.message || 'Check your credentials and network access.') };
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Configures the system, handles cloud environments with read-only filesystems.
 */
export async function configureSystem(formData: FormData) {
    const dbHost = formData.get('dbHost') as string;
    const dbUser = formData.get('dbUser') as string;
    const dbPassword = formData.get('dbPassword') as string;
    const dbName = formData.get('dbName') as string;
    const dbPort = formData.get('dbPort') as string || '3306';

    // Admin account fields
    const adminEmail = formData.get('adminEmail') as string;
    const adminPassword = formData.get('adminPassword') as string;

    if (!dbHost || !dbUser || !dbName) {
        return { error: 'Missing required database fields' };
    }

    if (!adminEmail || !adminPassword) {
        return { error: 'Admin email and password are required' };
    }

    // 1. Construct DATABASE_URL
    const dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    let envUpdateSuccess = true;
    let dbPushSuccess = true;
    let masterKey = '';
    let authSecret = '';

    try {
        // 2. Write to .env file
        const envPath = path.resolve(process.cwd(), '.env');

        // Read existing .env
        let envContent = '';
        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch (e) {
            // File might not exist
        }

        const newEnvLine = `DATABASE_URL="${dbUrl}"`;
        const dbUrlRegex = /^#?\s*DATABASE_URL=.*/m;

        if (dbUrlRegex.test(envContent)) {
            envContent = envContent.replace(dbUrlRegex, newEnvLine);
        } else {
            envContent += `\n${newEnvLine}\n`;
        }

        // Generate Secrets if missing
        const { randomBytes } = await import('crypto');

        if (!envContent.includes('MASTER_KEY=')) {
            masterKey = randomBytes(32).toString('hex');
            envContent += `\nMASTER_KEY="${masterKey}"\n`;
        } else {
            const match = envContent.match(/MASTER_KEY="?([^"\n]*)"?/);
            if (match) masterKey = match[1];
        }

        if (!envContent.includes('NEXTAUTH_SECRET=') && !envContent.includes('AUTH_SECRET=')) {
            authSecret = randomBytes(32).toString('hex');
            envContent += `\nNEXTAUTH_SECRET="${authSecret}"\n`;
        } else {
            const match = envContent.match(/(?:NEXTAUTH_SECRET|AUTH_SECRET)="?([^"\n]*)"?/);
            if (match) authSecret = match[1];
        }

        try {
            await fs.writeFile(envPath, envContent, 'utf8');
            console.log('[Setup] Updated .env file');
        } catch (fsError: any) {
            console.warn('[Setup] Failed to write .env file (Read-only filesystem?):', fsError.code);
            envUpdateSuccess = false;
        }

        // 3. Run Prisma Push (Schema Init)
        console.log('[Setup] Running DB Push...');
        try {
            await execPromise(`npx prisma db push --accept-data-loss`, {
                env: { ...process.env, DATABASE_URL: dbUrl }
            });
            console.log('[Setup] DB Push Success');
        } catch (execError: any) {
            console.warn('[Setup] DB Push Failed (Common in serverless/readonly home):', execError.message);
            dbPushSuccess = false;
        }

        // 4. Seed Data
        console.log('[Setup] Seeding Initial Data...');
        const prisma = new PrismaClient({
            datasources: { db: { url: dbUrl } },
        });

        let seedSuccess = true;
        try {
            // A. Existing Data Cleanup
            await prisma.credentialMaster.deleteMany({});

            // B. Seed Roles & Groups
            await seedRoles(prisma);

            // C. Seed System Admin
            const hashedPassword = await hash(adminPassword, 12);
            const existingUser = await prisma.user.findUnique({
                where: { email: adminEmail },
            });

            if (!existingUser) {
                const newUser = await prisma.user.create({
                    data: {
                        email: adminEmail,
                        passwordHash: hashedPassword,
                        name: 'System Admin',
                        role: 'ADMIN',
                        status: 'ACTIVE',
                    },
                });

                const adminGroup = await prisma.userGroup.findUnique({
                    where: { name: 'Administrator' }
                });

                if (adminGroup) {
                    await prisma.userGroupMapping.create({
                        data: {
                            userId: newUser.id,
                            groupId: adminGroup.id,
                            assignedBy: 'SYSTEM'
                        }
                    });
                }
            }
        } catch (seedError: any) {
            console.warn('[Setup] Seeding failed (Likely due to missing tables):', seedError.message);
            seedSuccess = false;
        } finally {
            await prisma.$disconnect();
        }

        const manualConfigRequired = !envUpdateSuccess || !dbPushSuccess || !seedSuccess;

        return {
            success: manualConfigRequired
                ? 'Initialization partially succeeded with manual steps.'
                : 'System Configured Successfully! Please restart the server.',
            manualConfigRequired,
            steps: {
                envUpdate: envUpdateSuccess,
                dbPush: dbPushSuccess,
                seed: seedSuccess
            },
            envVars: {
                DATABASE_URL: dbUrl,
                MASTER_KEY: masterKey,
                NEXTAUTH_SECRET: authSecret || process.env.NEXTAUTH_SECRET
            }
        };

    } catch (error: any) {
        console.error('[Setup] Configuration Failed:', error);
        return { error: 'Setup Failed: ' + error.message };
    }
}
