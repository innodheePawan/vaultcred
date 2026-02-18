const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'rvv.804205@gmail.com';

    console.log(`Updating user ${email}...`);

    const user = await prisma.user.update({
        where: { email },
        data: {
            // Set environments to allow creation in common envs
            allowedEnvironments: 'Dev,QA,Prod'
        }
    });

    console.log('User Updated:', JSON.stringify({
        email: user.email,
        allowedCategories: user.allowedCategories,
        allowedEnvironments: user.allowedEnvironments
    }, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
