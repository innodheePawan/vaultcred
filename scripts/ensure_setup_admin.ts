import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

const SETUP_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@credentialmanager.com';
const SETUP_ADMIN_PASSWORD = process.env.ADMIN_SETUP_PASSWORD;

if (!SETUP_ADMIN_PASSWORD || SETUP_ADMIN_PASSWORD.length < 12) {
    console.error('❌ Error: Set ADMIN_SETUP_PASSWORD environment variable (min 12 chars)');
    console.error('');
    console.error('   Usage:');
    console.error('   $env:ADMIN_SETUP_PASSWORD="YourStr0ng!Pass"; npx tsx scripts/ensure_setup_admin.ts');
    console.error('');
    console.error('   Optionally set ADMIN_EMAIL to override the default email.');
    process.exit(1);
}

async function main() {
    console.log(`Checking for user: ${SETUP_ADMIN_EMAIL}...`);

    const existingUser = await prisma.user.findUnique({
        where: { email: SETUP_ADMIN_EMAIL }
    });

    if (existingUser) {
        console.log('User already exists. Updating password and ensuring SUPER_ADMIN role...');
        const hashedPassword = await hash(SETUP_ADMIN_PASSWORD!, 12);

        const updated = await prisma.user.update({
            where: { email: SETUP_ADMIN_EMAIL },
            data: {
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
                name: 'Super Administrator'
            }
        });

        const superAdminGroup = await prisma.userGroup.findUnique({ where: { name: 'Super Admin' } });
        if (superAdminGroup) {
            await prisma.userGroupMapping.upsert({
                where: { userId_groupId: { userId: updated.id, groupId: superAdminGroup.id } },
                update: {},
                create: { userId: updated.id, groupId: superAdminGroup.id, assignedBy: 'SYSTEM' }
            });
        }
        console.log('User updated successfully.');
    } else {
        console.log('User not found. Creating new Super Admin...');
        const hashedPassword = await hash(SETUP_ADMIN_PASSWORD!, 12);

        const created = await prisma.user.create({
            data: {
                email: SETUP_ADMIN_EMAIL,
                passwordHash: hashedPassword,
                name: 'Super Administrator',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
            }
        });

        const superAdminGroup = await prisma.userGroup.findUnique({ where: { name: 'Super Admin' } });
        if (superAdminGroup) {
            await prisma.userGroupMapping.upsert({
                where: { userId_groupId: { userId: created.id, groupId: superAdminGroup.id } },
                update: {},
                create: { userId: created.id, groupId: superAdminGroup.id, assignedBy: 'SYSTEM' }
            });
        }
        console.log('User created successfully.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
