
import { sendPasswordResetEmail } from './lib/email';
import { prisma } from './lib/prisma';

// Mock getBaseUrl for testing since we are not in Next.js context
process.env.NEXTAUTH_URL = 'http://localhost:3000';

async function main() {
    console.log('Sending test password reset email to rakesh@innodhee.com...');
    try {
        const result = await sendPasswordResetEmail('rakesh@innodhee.com', 'test-token-12345');
        console.log('Result:', result);
    } catch (e) {
        console.error('Error sending email:', e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
