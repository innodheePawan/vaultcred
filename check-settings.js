const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogo() {
    try {
        const settings = await prisma.systemSettings.findFirst();
        console.log('---SETTINGS_START---');
        console.log(JSON.stringify(settings, null, 2));
        console.log('---SETTINGS_END---');
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkLogo();
