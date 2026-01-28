import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

const SETUP_ADMIN_EMAIL = 'admin@credentialmanager.com';
const SETUP_ADMIN_PASSWORD = 'Admin@123';

async function main() {
    console.log(`Checking for user: ${SETUP_ADMIN_EMAIL}...`);

    const existingUser = await prisma.user.findUnique({
        where: { email: SETUP_ADMIN_EMAIL }
    });

    if (existingUser) {
        console.log('User already exists. Updating password and ensuring ADMIN role...');
        const hashedPassword = await hash(SETUP_ADMIN_PASSWORD, 12);

        await prisma.user.update({
            where: { email: SETUP_ADMIN_EMAIL },
            data: {
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                name: 'Setup Administrator'
            }
        });
        console.log('User updated successfully.');
    } else {
        console.log('User not found. Creating new Setup Admin...');
        const hashedPassword = await hash(SETUP_ADMIN_PASSWORD, 12);

        await prisma.user.create({
            data: {
                email: SETUP_ADMIN_EMAIL,
                passwordHash: hashedPassword,
                name: 'Setup Administrator',
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });
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
