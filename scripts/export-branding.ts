import { prisma } from './lib/prisma';

async function main() {
    const s = await prisma.systemSettings.findFirst();
    console.log('--- BRANDING SETTINGS ---');
    console.log(`Application Name: ${s?.applicationName}`);
    console.log(`Company Name: ${s?.companyName}`);
    console.log(`Logo URL: ${s?.logoUrl}`);
    console.log('-------------------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());
