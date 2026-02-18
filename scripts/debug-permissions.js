const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'rvv.804205@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            role: true,
            isExternal: true,
            externalAccessType: true,
            allowedCategories: true, // This is a String (comma sep)
            allowedEnvironments: true, // This is a String (comma sep)
            allowedCredentialIds: true
        }
    });

    console.log('User Permission Debug:', JSON.stringify(user, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
