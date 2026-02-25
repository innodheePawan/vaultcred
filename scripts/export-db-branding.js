const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.systemSettings.findFirst();
    const output = `
APPLICATION_NAME: ${settings.applicationName}
COMPANY_NAME: ${settings.companyName}
LOGO_URL: ${settings.logoUrl}
  `;
    fs.writeFileSync('branding.txt', output.trim());
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
