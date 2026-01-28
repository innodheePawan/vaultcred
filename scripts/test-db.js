const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    console.log('Testing connection to:', dbUrl ? dbUrl.replace(/:[^:@]*@/, ':****@') : 'UNDEFINED');

    if (!dbUrl) {
        console.error('ERROR: DATABASE_URL is not set in .env');
        process.exit(1);
    }

    try {
        await prisma.$connect();
        console.log('✅ Connection successful!');

        const userCount = await prisma.user.count();
        console.log(`Found ${userCount} users.`);

    } catch (e) {
        console.error('❌ Connection failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
