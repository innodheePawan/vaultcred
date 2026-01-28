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

    if (!dbHost || !dbUser || !dbName) {
        return { error: 'Missing required database fields' };
    }

    // 1. Construct DATABASE_URL
    const dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

    try {
        // 2. Write to .env file
        const envPath = path.resolve(process.cwd(), '.env');

        // Read existing .env to preserve other keys (like NEXTAUTH_SECRET)
        let envContent = '';
        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch (e) {
            // File might not exist
        }

        const newEnvLine = `DATABASE_URL="${dbUrl}"`;

        // Regex to match DATABASE_URL=... or # DATABASE_URL=... (with optional whitespace)
        const dbUrlRegex = /^#?\s*DATABASE_URL=.*/m;

        if (dbUrlRegex.test(envContent)) {
            envContent = envContent.replace(dbUrlRegex, newEnvLine);
        } else {
            envContent += `\n${newEnvLine}\n`;
        }

        // Generate Secrets if missing
        const { randomBytes } = await import('crypto');

        if (!envContent.includes('MASTER_KEY=')) {
            const masterKey = randomBytes(32).toString('hex'); // 64 chars
            envContent += `\nMASTER_KEY="${masterKey}"\n`;
            console.log('[Setup] Generated new MASTER_KEY');
        }

        if (!envContent.includes('NEXTAUTH_SECRET=') && !envContent.includes('AUTH_SECRET=')) {
            const authSecret = randomBytes(32).toString('hex');
            envContent += `\nNEXTAUTH_SECRET="${authSecret}"\n`;
            console.log('[Setup] Generated new NEXTAUTH_SECRET');
        }

        await fs.writeFile(envPath, envContent, 'utf8');
        console.log('[Setup] Updated .env file');

        // 3. Run Prisma Push (Schema Init)
        // We set the env var for this process specifically to ensure it uses the new URL immediately
        console.log('[Setup] Running DB Push...');
        await execPromise(`npx prisma db push`, {
            env: { ...process.env, DATABASE_URL: dbUrl }
        });

        // 4. Seed Data
        console.log('[Setup] Seeding Initial Data...');

        // We need a fresh Prisma Client instance with the new URL
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: dbUrl,
                },
            },
        });

        try {
            // A. Existing Data Cleanup (Requested: Clear all credentials)
            console.log('[Setup] Clearing any existing credentials...');
            await prisma.credentialMaster.deleteMany({});

            // B. Seed Roles & Groups
            await seedRoles(prisma);

            // C. Seed System Admin
            const adminEmail = 'admin@innodhee.com';
            const adminPassword = 'Admin@123';
            const hashedPassword = await hash(adminPassword, 12);

            const existingUser = await prisma.user.findUnique({
                where: { email: adminEmail },
            });

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        email: adminEmail,
                        passwordHash: hashedPassword,
                        name: 'System Admin',
                        role: 'ADMIN',
                        status: 'ACTIVE',
                    },
                });
                console.log(`[Setup] Created real admin user: ${adminEmail}`);
            }

        } finally {
            await prisma.$disconnect();
        }

        return { success: true, message: 'System Configured Successfully! Please restart the server.' };

    } catch (error: any) {
        console.error('[Setup] Configuration Failed:', error);
        return { error: 'Setup Failed: ' + error.message };
    }
}
