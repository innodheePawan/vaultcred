import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@credentialmanager.com';
    const password = 'Admin@123';
    const hashedPassword = await hash(password, 12);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!existingUser) {
        await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name: 'System Admin',
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        console.log(`Created admin user: ${email}`);
    } else {
        console.log(`Admin user already exists: ${email}`);
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
