import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'pawan@wiseliquid.com';
    console.log(`Disabling 2FA for user: ${email} and disabling mandatory 2FA globally.`);
    
    // Disable for user
    await prisma.user.update({
        where: { email },
        data: {
            twoFactorEnabled: false,
            twoFactorSecret: null
        }
    });

    // Disable globally
    const settings = await prisma.systemSettings.findFirst();
    if (settings) {
        await prisma.systemSettings.update({
            where: { id: settings.id },
            data: {
                twoFactorMandatory: false
            }
        });
        console.log('Global mandatory 2FA disabled.');
    }
    
    console.log('2FA disabled successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
