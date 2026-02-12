import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { seedRoles } from '../scripts/seed-roles';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed process...');

    // Seed Roles and Groups
    await seedRoles(prisma);

    console.log('Seed process complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
