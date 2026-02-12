
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.systemSettings.findFirst();
    console.log('--- SETTINGS START ---');
    console.log('SMTP Configured:', !!settings);
    if (settings) {
        console.log('smtpHost:', settings.smtpHost);
        console.log('smtpUser:', settings.smtpUser);
        console.log('smtpFromEmail:', settings.smtpFromEmail);
    }
    console.log('--- SETTINGS END ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
