'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { seedRoles } from '@/scripts/seed-roles';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const execPromise = util.promisify(exec);

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
        await execPromise(`npx prisma db push`, {
            env: { ...process.env, DATABASE_URL: dbUrl }
        });

        // 4. Seed Data
        console.log('[Setup] Seeding Initial Data...');
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: dbUrl,
                },
            },
        });

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

        } finally {
            await prisma.$disconnect();
        }

        return {
            success: true,
            message: envUpdateSuccess
                ? 'System Configured Successfully! Please restart the server.'
                : 'Database Initialized! Manual configuration required.',
            manualConfigRequired: !envUpdateSuccess,
            envVars: !envUpdateSuccess ? {
                DATABASE_URL: dbUrl,
                MASTER_KEY: masterKey,
                NEXTAUTH_SECRET: authSecret || process.env.NEXTAUTH_SECRET
            } : null
        };

    } catch (error: any) {
        console.error('[Setup] Configuration Failed:', error);
        return { error: 'Setup Failed: ' + error.message };
    }
}
