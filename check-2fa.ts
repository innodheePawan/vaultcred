import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("--- 2FA Reset Tokens ---");
    const resetTokens = await prisma.twoFactorResetToken.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log(resetTokens);

    console.log("\n--- Users with 2FA ---");
    const users = await prisma.user.findMany({
        where: { twoFactorEnabled: true },
        select: { email: true, twoFactorEnabled: true, twoFactorSecret: true },
        take: 5
    });
    console.log(users);
}
main().finally(() => prisma.$disconnect());
