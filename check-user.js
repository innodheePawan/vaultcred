const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'rakesh@innodhee.com' }
        });
        console.log('---USER_START---');
        console.log(JSON.stringify(user, null, 2));
        console.log('---USER_END---');
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
