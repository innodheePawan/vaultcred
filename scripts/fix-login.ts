
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'icyoucrazy@gmail.com';
    const password = 'password123';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log('User NOT found.');
        console.log('Creating user...');
        const hashedPassword = await hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                name: 'Rakesh',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });
        console.log(`User created with password: ${password}`);
    } else {
        console.log(`User found: ${user.name} (${user.role})`);
        console.log('Resetting password just in case...');
        const hashedPassword = await hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { passwordHash: hashedPassword }
        });
        console.log(`Password reset to: ${password}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
