const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
    try {
        const password = 'Password@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const updatedUser = await prisma.user.update({
            where: { email: 'rakesh@innodhee.com' },
            data: {
                passwordHash: hashedPassword,
                failedAttempts: 0,
                lockExpiresAt: null,
                requiresCaptcha: false
            }
        });

        console.log('---RESET_SUCCESS---');
        console.log('User: rakesh@innodhee.com');
        console.log('New Password: ' + password);
        console.log('Status: Account Unlocked');
    } catch (err) {
        console.error('---RESET_FAILED---');
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
